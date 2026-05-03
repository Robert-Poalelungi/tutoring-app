const { CalendarSessions } = require("../models");
const sequelize = require("../config/db");

// GET /api/settings/session — sesiunea activă (public)
const getActiveSession = async (req, res) => {
  try {
    let session = await CalendarSessions.findByPk(1);

    if (!session) {
      session = await CalendarSessions.create({
        id: 1,
        activeSession: "winter",
        winterMonths: [1, 2],
        summerMonths: [6, 7],
      });
    }

    // Citim seasonalTheme via raw query (coloana adăugată prin migrare la startup)
    let seasonalTheme = true;
    try {
      const [rows] = await sequelize.query(
        "SELECT `seasonalTheme` FROM `CalendarSessions` WHERE `id` = 1;"
      );
      if (rows.length > 0) seasonalTheme = rows[0].seasonalTheme !== 0;
    } catch (_) {}

    return res.status(200).json({
      activeSession: session.activeSession,
      months: session.activeSession === "winter" ? session.winterMonths : session.summerMonths,
      winterMonths: session.winterMonths,
      summerMonths: session.summerMonths,
      seasonalTheme,
    });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = { getActiveSession };
