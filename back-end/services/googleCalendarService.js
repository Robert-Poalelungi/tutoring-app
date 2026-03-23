const { google } = require("googleapis");
const { GoogleCalendarConnection, ConsultationCalendarSync, Consultation, Course, User, UserConsultation } = require("../models");
const { calculateEndTime } = require("../utils/dateHelpers");

// Creează un client OAuth2 pentru Google Calendar
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );
};

// Generează URL-ul de autorizare OAuth
const getAuthUrl = () => {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
};

// Obține token-urile din codul de autorizare
const getTokensFromCode = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Creează un client Google Calendar autentificat pentru un student
const getCalendarClient = async (connection) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiry ? new Date(connection.tokenExpiry).getTime() : null,
  });

  // Reîmprospătare automată a token-ului
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      connection.accessToken = tokens.access_token;
    }
    if (tokens.expiry_date) {
      connection.tokenExpiry = new Date(tokens.expiry_date);
    }
    await connection.save();
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
};

// Creează un eveniment în Google Calendar pentru un student
const createEvent = async (userId, consultationId) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({
      where: { userId, isActive: true },
    });

    if (!connection) return;

    const consultation = await Consultation.findByPk(consultationId, {
      include: [
        { model: Course, as: "course" },
        { model: User, as: "professor", attributes: ["firstName", "lastName"] },
      ],
    });

    if (!consultation) return;

    const calendar = await getCalendarClient(connection);
    const timeStr = consultation.time.slice(0, 5); // "HH:MM" — MySQL TIME returns "HH:MM:SS"
    const endTime = calculateEndTime(timeStr, consultation.duration);

    const event = {
      summary: `Consultație: ${consultation.course.name}`,
      description: `Profesor: ${consultation.professor.firstName} ${consultation.professor.lastName}\nTip: ${consultation.type}${consultation.room ? `\nSala: ${consultation.room}` : ""}${consultation.meetingLink ? `\nLink: ${consultation.meetingLink}` : ""}${consultation.materialsLink ? `\nMateriale: ${consultation.materialsLink}` : ""}`,
      start: {
        dateTime: `${consultation.date}T${timeStr}:00`,
        timeZone: "Europe/Bucharest",
      },
      end: {
        dateTime: `${consultation.date}T${endTime}:00`,
        timeZone: "Europe/Bucharest",
      },
      location: consultation.type === "fizic" ? consultation.room : consultation.meetingLink,
    };

    const response = await calendar.events.insert({
      calendarId: connection.calendarId,
      resource: event,
    });

    await ConsultationCalendarSync.create({
      consultationId,
      userId,
      googleEventId: response.data.id,
      calendarId: connection.calendarId,
      syncStatus: "synced",
      lastSyncedAt: new Date(),
    });
  } catch (error) {
    console.error(`Eroare la crearea evenimentului Google Calendar (user ${userId}):`, error.message);

    await ConsultationCalendarSync.create({
      consultationId,
      userId,
      googleEventId: "error",
      calendarId: "error",
      syncStatus: "failed",
      lastError: error.message,
    });
  }
};

// Actualizează un eveniment existent în Google Calendar
const updateEvent = async (userId, consultationId) => {
  try {
    const sync = await ConsultationCalendarSync.findOne({
      where: { userId, consultationId, syncStatus: "synced" },
    });

    if (!sync) return;

    const connection = await GoogleCalendarConnection.findOne({
      where: { userId, isActive: true },
    });

    if (!connection) return;

    const consultation = await Consultation.findByPk(consultationId, {
      include: [
        { model: Course, as: "course" },
        { model: User, as: "professor", attributes: ["firstName", "lastName"] },
      ],
    });

    if (!consultation) return;

    const calendar = await getCalendarClient(connection);
    const timeStr = consultation.time.slice(0, 5);
    const endTime = calculateEndTime(timeStr, consultation.duration);

    const event = {
      summary: `Consultație: ${consultation.course.name}`,
      description: `Profesor: ${consultation.professor.firstName} ${consultation.professor.lastName}\nTip: ${consultation.type}${consultation.room ? `\nSala: ${consultation.room}` : ""}${consultation.meetingLink ? `\nLink: ${consultation.meetingLink}` : ""}${consultation.materialsLink ? `\nMateriale: ${consultation.materialsLink}` : ""}`,
      start: {
        dateTime: `${consultation.date}T${timeStr}:00`,
        timeZone: "Europe/Bucharest",
      },
      end: {
        dateTime: `${consultation.date}T${endTime}:00`,
        timeZone: "Europe/Bucharest",
      },
      location: consultation.type === "fizic" ? consultation.room : consultation.meetingLink,
    };

    await calendar.events.update({
      calendarId: sync.calendarId,
      eventId: sync.googleEventId,
      resource: event,
    });

    sync.lastSyncedAt = new Date();
    sync.lastError = null;
    await sync.save();
  } catch (error) {
    console.error(`Eroare la actualizarea evenimentului Google Calendar (user ${userId}):`, error.message);

    const sync = await ConsultationCalendarSync.findOne({
      where: { userId, consultationId },
    });
    if (sync) {
      sync.syncStatus = "failed";
      sync.lastError = error.message;
      await sync.save();
    }
  }
};

// Șterge un eveniment din Google Calendar
const deleteEvent = async (userId, consultationId) => {
  try {
    const sync = await ConsultationCalendarSync.findOne({
      where: { userId, consultationId, syncStatus: "synced" },
    });

    if (!sync) return;

    const connection = await GoogleCalendarConnection.findOne({
      where: { userId, isActive: true },
    });

    if (!connection) return;

    const calendar = await getCalendarClient(connection);

    await calendar.events.delete({
      calendarId: sync.calendarId,
      eventId: sync.googleEventId,
    });

    await sync.destroy();
  } catch (error) {
    console.error(`Eroare la ștergerea evenimentului Google Calendar (user ${userId}):`, error.message);
  }
};

// Sincronizează toți studenții conectați pentru o consultație (la update/cancel/delete)
const syncAllForConsultation = async (consultationId, action) => {
  const syncs = await ConsultationCalendarSync.findAll({
    where: { consultationId, syncStatus: "synced" },
  });

  for (const sync of syncs) {
    if (action === "update") {
      await updateEvent(sync.userId, consultationId);
    } else if (action === "delete") {
      await deleteEvent(sync.userId, consultationId);
    }
  }
};

// Revocă conexiunea Google Calendar a unui student
const revokeConnection = async (userId) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({
      where: { userId, isActive: true },
    });

    if (!connection) return;

    // Revocă token-ul la Google
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: connection.accessToken });
    try {
      await oauth2Client.revokeToken(connection.accessToken);
    } catch (err) {
      // Token-ul poate fi deja expirat/revocat
      console.log("Token deja revocat sau expirat.");
    }

    // Șterge evenimentele sincronizate
    const syncs = await ConsultationCalendarSync.findAll({
      where: { userId },
    });
    for (const sync of syncs) {
      await sync.destroy();
    }

    // Marchează conexiunea ca inactivă
    connection.isActive = false;
    await connection.save();
  } catch (error) {
    console.error(`Eroare la revocarea conexiunii Google Calendar (user ${userId}):`, error.message);
    throw error;
  }
};

module.exports = {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  createEvent,
  updateEvent,
  deleteEvent,
  syncAllForConsultation,
  revokeConnection,
};
