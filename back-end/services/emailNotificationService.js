const cron = require("node-cron");
const { Op } = require("sequelize");
const { Consultation, Course, User, UserConsultation, NotificationPreference } = require("../models");
const { sendReminderEmail, sendCancellationEmail, sendReactivationEmail } = require("./emailService");
const { combineDateAndTime } = require("../utils/dateHelpers");

let isReminderJobRunning = false;
let reminderJobStartedAt = null;

const REMINDER_MAX_CONCURRENCY = Math.max(1, Number(process.env.REMINDER_MAX_CONCURRENCY || 3));
const EMAIL_SEND_TIMEOUT_MS = Math.max(5000, Number(process.env.EMAIL_SEND_TIMEOUT_MS || 20000));
const REMINDER_CYCLE_STALE_MS = Math.max(60000, Number(process.env.REMINDER_CYCLE_STALE_MS || 10 * 60 * 1000));

const withTimeout = async (promise, timeoutMs, label) => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const runWithConcurrency = async (items, concurrency, worker) => {
  if (!Array.isArray(items) || !items.length) return;

  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) return;
      await worker(items[currentIndex]);
    }
  });

  await Promise.all(workers);
};

const isEligibleBySerie = (consultationSerie, studentSerie) => {
  const normalizedConsultationSerie = (consultationSerie || "Toate").toLowerCase();
  const normalizedStudentSerie = (studentSerie || "").toLowerCase().trim();

  if (!normalizedStudentSerie) {
    return true;
  }

  if (normalizedConsultationSerie === "toate") {
    return true;
  }

  return normalizedConsultationSerie === normalizedStudentSerie
    || normalizedConsultationSerie.includes(normalizedStudentSerie);
};

const isStudentEligibleForConsultation = (consultation, student) => {
  const course = consultation.course;
  if (!course) return false;

  if (student.studyYear && Number(course.studyYear) !== Number(student.studyYear)) {
    return false;
  }

  if (
    student.specializationId
    && Number(course.specializationId) !== Number(student.specializationId)
    && course.specializationId !== null
  ) {
    return false;
  }

  return isEligibleBySerie(consultation.serie, student.serie);
};

const ensureAutoEnrollmentsForConsultation = async (consultation, students) => {
  for (const student of students) {
    if (!isStudentEligibleForConsultation(consultation, student)) {
      continue;
    }

    const [record] = await UserConsultation.findOrCreate({
      where: {
        userId: student.id,
        consultationId: consultation.id,
      },
      defaults: {
        source: "auto",
        status: "active",
        enrolledAt: new Date(),
      },
    });

    // Dacă exista o înregistrare auto retrasă, o reactivăm pentru a păstra
    // comportamentul din dashboard (consultațiile eligibile apar la student).
    if (record.source === "auto" && record.status !== "active") {
      record.status = "active";
      record.withdrawnAt = null;
      if (!record.enrolledAt) {
        record.enrolledAt = new Date();
      }
      await record.save();
    }
  }
};

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

    const notificationStudents = await User.findAll({
      where: {
        role: "student",
        emailNotificationsEnabled: true,
      },
      attributes: ["id", "email", "studyYear", "specializationId", "serie"],
    });

    for (const consultation of upcomingConsultations) {
      const consultationTime = combineDateAndTime(consultation.date, consultation.time);

      if (Number.isNaN(consultationTime.getTime())) {
        console.warn(`[Email Scheduler] Data/ora invalidă pentru consultația ${consultation.id}:`, consultation.date, consultation.time);
        continue;
      }

      // Skip dacă consultația e în trecut
      if (consultationTime <= now) continue;

      const isWithin24Hours = consultationTime <= in24Hours;
      const isWithin1Hour = consultationTime <= in1Hour;

      if (!isWithin24Hours) continue;

      // Aliniază reminder-ele cu logica din dashboard: consultațiile eligibile automat
      // au înregistrare de înscriere activă pentru student.
      await ensureAutoEnrollmentsForConsultation(consultation, notificationStudents);

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
            include: [{ model: NotificationPreference, as: "notificationPreference" }],
          },
        ],
      });

      await runWithConcurrency(enrollments, REMINDER_MAX_CONCURRENCY, async (enrollment) => {
        try {
          const preferences = enrollment.user.notificationPreference;
          const wants1Hour = preferences ? preferences.reminder1hour : true;
          const wants1Day = preferences ? preferences.reminder1day : true;

          // Reminder 1 oră
          if (isWithin1Hour && wants1Hour && !enrollment.reminder1hourSent) {
            await withTimeout(
              sendReminderEmail(enrollment.user.email, consultation, "1hour"),
              EMAIL_SEND_TIMEOUT_MS,
              "sendReminderEmail(1hour)",
            );
            enrollment.reminder1hourSent = true;
            await enrollment.save();
          }
          // Reminder 1 zi (doar dacă nu e deja în intervalul de 1 oră — evită dublu reminder)
          else if (isWithin24Hours && !isWithin1Hour && wants1Day && !enrollment.reminder1daySent) {
            await withTimeout(
              sendReminderEmail(enrollment.user.email, consultation, "1day"),
              EMAIL_SEND_TIMEOUT_MS,
              "sendReminderEmail(1day)",
            );
            enrollment.reminder1daySent = true;
            await enrollment.save();
          }
        } catch (emailError) {
          console.error(
            `[Email Scheduler] Eșec reminder pentru enrollment ${enrollment.id} (consultație ${consultation.id}):`,
            emailError.message,
          );
        }
      });
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
          include: [{ model: NotificationPreference, as: "notificationPreference" }],
        },
      ],
    });

    await runWithConcurrency(enrollments, REMINDER_MAX_CONCURRENCY, async (enrollment) => {
      const preferences = enrollment.user.notificationPreference;
      const wantsCancellation = preferences ? preferences.cancellation : true;
      if (!wantsCancellation) return;

      await withTimeout(
        sendCancellationEmail(enrollment.user.email, consultation),
        EMAIL_SEND_TIMEOUT_MS,
        "sendCancellationEmail",
      );
    });
  } catch (error) {
    console.error("Eroare la trimiterea emailurilor de anulare:", error.message);
  }
};

// Trimite email de reactivare tuturor studenților înscriși la o consultație
const sendReactivationEmails = async (consultationId) => {
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
          include: [{ model: NotificationPreference, as: "notificationPreference" }],
        },
      ],
    });

    await runWithConcurrency(enrollments, REMINDER_MAX_CONCURRENCY, async (enrollment) => {
      const preferences = enrollment.user.notificationPreference;
      const wantsCancellation = preferences ? preferences.cancellation : true;
      if (!wantsCancellation) return;

      await withTimeout(
        sendReactivationEmail(enrollment.user.email, consultation),
        EMAIL_SEND_TIMEOUT_MS,
        "sendReactivationEmail",
      );
    });
  } catch (error) {
    console.error("Eroare la trimiterea emailurilor de reactivare:", error.message);
  }
};

// Pornește scheduler-ul cron (la fiecare 15 minute)
const startEmailScheduler = () => {
  const runReminderCycle = async () => {
    if (isReminderJobRunning) {
      const runningForMs = reminderJobStartedAt ? Date.now() - reminderJobStartedAt : 0;
      if (runningForMs > REMINDER_CYCLE_STALE_MS) {
        console.warn(
          `[Email Scheduler] Lock stale detectat (${runningForMs}ms). Resetare lock pentru reluarea ciclului.`,
        );
        isReminderJobRunning = false;
        reminderJobStartedAt = null;
      } else {
        console.log("[Email Scheduler] Skip: ciclul anterior este inca in executie.");
        return;
      }
    }

    if (isReminderJobRunning) {
      console.log("[Email Scheduler] Skip: ciclul anterior este inca in executie.");
      return;
    }

    isReminderJobRunning = true;
    reminderJobStartedAt = Date.now();
    try {
      await processReminders();
    } finally {
      isReminderJobRunning = false;
      reminderJobStartedAt = null;
    }
  };

  // Rulează o dată la pornirea serverului (evită ratarea ferestrei până la primul tick cron)
  runReminderCycle();

  cron.schedule("* * * * *", () => {
    console.log("[Email Scheduler] Verificare reminder-e...");
    runReminderCycle();
  });
  console.log("[Email Scheduler] Scheduler pornit — verificare la fiecare 1 minut.");
};

module.exports = {
  startEmailScheduler,
  sendCancellationEmails,
  sendReactivationEmails,
  processReminders,
};
