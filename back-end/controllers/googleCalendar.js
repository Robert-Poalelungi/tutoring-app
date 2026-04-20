const { GoogleCalendarConnection, ConsultationCalendarSync, User, Consultation, Course, UserConsultation } = require("../models");
const { Op } = require("sequelize");
const {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  createEvent,
  revokeConnection,
  syncAllForUser,
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
  const { code, state: rawUserId, error: oauthError } = req.query;
  const userId = parseInt(rawUserId, 10);

  if (oauthError || !code) {
    console.error("[GCal callback] OAuth error or missing code:", oauthError);
    return res.redirect(`${process.env.ORIGIN_SITE}/profil?calendar=error`);
  }

  if (!userId || isNaN(userId)) {
    console.error("[GCal callback] Missing or invalid state/userId:", rawUserId);
    return res.redirect(`${process.env.ORIGIN_SITE}/profil?calendar=error`);
  }

  try {
    console.log("[GCal callback] Exchanging code for tokens, userId:", userId);
    const tokens = await getTokensFromCode(code);
    console.log("[GCal callback] Tokens received. Has refresh_token:", !!tokens.refresh_token);

    if (!tokens.access_token) {
      throw new Error("No access_token in token response");
    }

    // Obține email-ul din baza de date
    const dbUser = await User.findByPk(userId);
    const googleEmail = dbUser ? dbUser.email : "unknown";
    console.log("[GCal callback] User found:", !!dbUser, "email:", googleEmail);

    // Verifică dacă există deja o conexiune
    let connection = await GoogleCalendarConnection.findOne({ where: { userId } });

    if (connection) {
      connection.accessToken = tokens.access_token;
      if (tokens.refresh_token) connection.refreshToken = tokens.refresh_token;
      connection.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
      connection.googleEmail = googleEmail;
      connection.isActive = true;
      await connection.save();
      console.log("[GCal callback] Updated existing connection");
    } else {
      // Dacă nu avem refresh_token (Google nu îl trimite din nou), afișăm eroare clară
      if (!tokens.refresh_token) {
        throw new Error("No refresh_token returned. User may need to revoke access in Google account and retry.");
      }
      connection = await GoogleCalendarConnection.create({
        userId,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarId: "primary",
        isActive: true,
      });
      console.log("[GCal callback] Created new connection, id:", connection.id);
    }

    // Sincronizează toate consultațiile în background (nu blochează redirect-ul)
    syncAllForUser(userId).catch((err) =>
      console.error("[GCal callback] syncAllForUser error:", err.message)
    );

    res.redirect(`${process.env.ORIGIN_SITE}/profil?calendar=connected`);
  } catch (error) {
    console.error("[GCal callback] ERROR:", error.message, error.stack);
    res.redirect(`${process.env.ORIGIN_SITE}/profil?calendar=error`);
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

    const student = await User.findByPk(req.user.id);

    // 1. Consultații din UserConsultation (manuale + auto înregistrate)
    const enrollments = await UserConsultation.findAll({
      where: { userId: req.user.id, status: "active" },
      include: [{ model: Consultation, as: "consultation", where: { status: "published" } }],
    });
    const enrolledIds = new Set(enrollments.map((e) => e.consultationId));

    // 2. Consultații auto (după an + specializare) — prinde și cele fără UserConsultation
    let autoConsultations = [];
    if (student.studyYear && student.specializationId) {
      autoConsultations = await Consultation.findAll({
        where: { status: "published" },
        include: [{ model: Course, as: "course", where: { studyYear: student.studyYear, specializationId: student.specializationId } }],
      });
    }

    // Unificăm ID-urile
    const allConsultationIds = new Set([
      ...enrolledIds,
      ...autoConsultations.map((c) => c.id),
    ]);

    let synced = 0;
    for (const consultationId of allConsultationIds) {
      const existingSync = await ConsultationCalendarSync.findOne({
        where: { userId: req.user.id, consultationId, syncStatus: "synced" },
      });

      if (!existingSync) {
        await createEvent(req.user.id, consultationId);
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
