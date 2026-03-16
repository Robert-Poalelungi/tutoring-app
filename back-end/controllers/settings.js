const { CalendarSessions } = require("../models");

// GET /api/settings/session — sesiunea activă (public)
const getActiveSession = async (req, res) => {
  try {
    let session = await CalendarSessions.findByPk(1);

    // Dacă nu există, creează înregistrarea singleton cu valori default
    if (!session) {
      session = await CalendarSessions.create({
        id: 1,
        activeSession: "winter",
        winterMonths: [1, 2],
        summerMonths: [6, 7],
      });
    }

    return res.status(200).json({
      activeSession: session.activeSession,
      months: session.activeSession === "winter" ? session.winterMonths : session.summerMonths,
      winterMonths: session.winterMonths,
      summerMonths: session.summerMonths,
    });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = { getActiveSession };
