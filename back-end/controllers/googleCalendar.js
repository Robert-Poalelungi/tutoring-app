const { google } = require("googleapis");
const { GoogleCalendarConnection, ConsultationCalendarSync } = require("../models");
const {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  createEvent,
  revokeConnection,
} = require("../services/googleCalendarService");

// GET /api/google-calendar/connect — inițiază OAuth flow
const connect = (req, res) => {
  const authUrl = getAuthUrl();
  // Salvează userId în state pentru callback
  const stateUrl = `${authUrl}&state=${req.user.id}`;
  res.redirect(stateUrl);
};

// GET /api/google-calendar/callback — callback OAuth
const callback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code) {
      return res.redirect(`${process.env.ORIGIN_SITE}/student/dashboard?calendar=error`);
    }

    const tokens = await getTokensFromCode(code);

    // Obține email-ul Google al utilizatorului
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Verifică dacă există deja o conexiune
    let connection = await GoogleCalendarConnection.findOne({
      where: { userId },
    });

    if (connection) {
      // Actualizează conexiunea existentă
      connection.accessToken = tokens.access_token;
      connection.refreshToken = tokens.refresh_token || connection.refreshToken;
      connection.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
      connection.googleEmail = userInfo.data.email;
      connection.isActive = true;
      await connection.save();
    } else {
      // Creează conexiune nouă
      connection = await GoogleCalendarConnection.create({
        userId,
        googleEmail: userInfo.data.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarId: "primary",
        isActive: true,
      });
    }

    res.redirect(`${process.env.ORIGIN_SITE}/student/dashboard?calendar=connected`);
  } catch (error) {
    console.error("Eroare la callback Google Calendar:", error.message);
    res.redirect(`${process.env.ORIGIN_SITE}/student/dashboard?calendar=error`);
  }
};

// GET /api/google-calendar/status — starea conexiunii
const getStatus = async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({
      where: { userId: req.user.id, isActive: true },
    });

    if (!connection) {
      return res.status(200).json({ connected: false });
    }

    // Ultima sincronizare reușită
    const lastSync = await ConsultationCalendarSync.findOne({
      where: { userId: req.user.id, syncStatus: "synced" },
      order: [["lastSyncedAt", "DESC"]],
    });

    return res.status(200).json({
      connected: true,
      googleEmail: connection.googleEmail,
      lastSyncedAt: lastSync ? lastSync.lastSyncedAt : null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// POST /api/google-calendar/disconnect — deconectează calendarul
const disconnect = async (req, res) => {
  try {
    await revokeConnection(req.user.id);
    return res.status(200).json({ message: "Google Calendar deconectat cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare la deconectare.", error: error.message });
  }
};

// POST /api/google-calendar/sync — forțează re-sincronizarea
const syncAll = async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({
      where: { userId: req.user.id, isActive: true },
    });

    if (!connection) {
      return res.status(400).json({ message: "Google Calendar nu este conectat." });
    }

    // Găsește consultațiile la care e înscris studentul
    const { UserConsultation, Consultation } = require("../models");
    const enrollments = await UserConsultation.findAll({
      where: { userId: req.user.id, status: "active" },
      include: [
        {
          model: Consultation,
          as: "consultation",
          where: { status: "published" },
        },
      ],
    });

    let synced = 0;
    for (const enrollment of enrollments) {
      // Verifică dacă există deja un sync
      const existingSync = await ConsultationCalendarSync.findOne({
        where: {
          userId: req.user.id,
          consultationId: enrollment.consultationId,
          syncStatus: "synced",
        },
      });

      if (!existingSync) {
        await createEvent(req.user.id, enrollment.consultationId);
        synced++;
      }
    }

    return res.status(200).json({ message: `Sincronizare completă. ${synced} evenimente noi create.` });
  } catch (error) {
    return res.status(500).json({ message: "Eroare la sincronizare.", error: error.message });
  }
};

module.exports = {
  connect,
  callback,
  getStatus,
  disconnect,
  syncAll,
};
