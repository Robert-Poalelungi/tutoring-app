const cron = require("node-cron");
const { Op } = require("sequelize");
const { Consultation, Course, User, UserConsultation, Faculty, Specialization } = require("../models");
const { sendReminderEmail, sendCancellationEmail } = require("./emailService");
const { combineDateAndTime } = require("../utils/dateHelpers");

// Trimite reminder-e pentru consultațiile care se apropie
const processReminders = async () => {
  try {
    const now = new Date();
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Consultații publicate care au loc în următoarele 24 de ore
    const upcomingConsultations = await Consultation.findAll({
      where: { status: "published" },
      include: [
        { model: Course, as: "course" },
        { model: User, as: "professor", attributes: ["id", "firstName", "lastName"] },
      ],
    });

    for (const consultation of upcomingConsultations) {
      const consultationTime = combineDateAndTime(consultation.date, consultation.time);

      // Skip dacă consultația e în trecut
      if (consultationTime <= now) continue;

      const isWithin24Hours = consultationTime <= in24Hours;
      const isWithin1Hour = consultationTime <= in1Hour;

      if (!isWithin24Hours) continue;

      // Găsește studenții înscriși activi cu notificări activate
      const enrollments = await UserConsultation.findAll({
        where: {
          consultationId: consultation.id,
          status: "active",
        },
        include: [
          {
            model: User,
            as: "user",
            where: { emailNotificationsEnabled: true },
            attributes: ["id", "email"],
          },
        ],
      });

      for (const enrollment of enrollments) {
        // Reminder 1 oră
        if (isWithin1Hour && !enrollment.reminder1hourSent) {
          await sendReminderEmail(enrollment.user.email, consultation, "1hour");
          enrollment.reminder1hourSent = true;
          await enrollment.save();
        }
        // Reminder 1 zi (doar dacă nu e deja în intervalul de 1 oră — evită dublu reminder)
        else if (isWithin24Hours && !isWithin1Hour && !enrollment.reminder1daySent) {
          await sendReminderEmail(enrollment.user.email, consultation, "1day");
          enrollment.reminder1daySent = true;
          await enrollment.save();
        }
      }
    }
  } catch (error) {
    console.error("Eroare la procesarea reminder-elor:", error.message);
  }
};

// Trimite email de anulare tuturor studenților înscriși la o consultație
const sendCancellationEmails = async (consultationId) => {
  try {
    const consultation = await Consultation.findByPk(consultationId, {
      include: [
        { model: Course, as: "course" },
        { model: User, as: "professor", attributes: ["id", "firstName", "lastName"] },
      ],
    });

    if (!consultation) return;

    const enrollments = await UserConsultation.findAll({
      where: {
        consultationId,
        status: "active",
      },
      include: [
        {
          model: User,
          as: "user",
          where: { emailNotificationsEnabled: true },
          attributes: ["id", "email"],
        },
      ],
    });

    for (const enrollment of enrollments) {
      await sendCancellationEmail(enrollment.user.email, consultation);
    }
  } catch (error) {
    console.error("Eroare la trimiterea emailurilor de anulare:", error.message);
  }
};

// Pornește scheduler-ul cron (la fiecare 15 minute)
const startEmailScheduler = () => {
  cron.schedule("*/15 * * * *", () => {
    console.log("[Email Scheduler] Verificare reminder-e...");
    processReminders();
  });
  console.log("[Email Scheduler] Scheduler pornit — verificare la fiecare 15 minute.");
};

module.exports = {
  startEmailScheduler,
  sendCancellationEmails,
  processReminders,
};
