const { Consultation, Course, User, UserConsultation, Faculty, Specialization } = require("../models");
const { Op } = require("sequelize");
const { enrollMatchingStudentsInConsultation } = require("../services/autoEnrollmentService");
const { sendCancellationEmails } = require("../services/emailNotificationService");
const { createEvent, deleteEvent, syncAllForConsultation } = require("../services/googleCalendarService");

// Returnează toate consultațiile (public - pentru calendar)
const getAllConsultations = async (req, res) => {
  try {
    const { studyYear, specializationId } = req.query;
    const courseWhere = {};

    if (studyYear) courseWhere.studyYear = studyYear;
    if (specializationId) courseWhere.specializationId = specializationId;

    const consultations = await Consultation.findAll({
      where: { status: "published" },
      include: [
        {
          model: Course,
          as: "course",
          where: Object.keys(courseWhere).length ? courseWhere : undefined,
          include: [
            { model: Faculty, as: "faculty" },
            { model: Specialization, as: "specialization" },
          ],
        },
        { model: User, as: "professor", attributes: ["id", "firstName", "lastName"] },
      ],
    });

    return res.status(200).json(consultations);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează o consultație după ID
const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: "course",
          include: [
            { model: Faculty, as: "faculty" },
            { model: Specialization, as: "specialization" },
          ],
        },
        { model: User, as: "professor", attributes: ["id", "firstName", "lastName"] },
      ],
    });

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    return res.status(200).json(consultation);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Creează o consultație (profesor / admin)
const createConsultation = async (req, res) => {
  try {
    const { courseId, date, time, duration, type, room, meetingLink, materialsLink, status } = req.body;

    if (!courseId || !date || !time || !type) {
      return res.status(400).json({ message: "Câmpurile courseId, date, time și type sunt obligatorii." });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Materia nu a fost găsită." });
    }

    if (type === "online" && !meetingLink) {
      return res.status(400).json({ message: "Link-ul de meeting este obligatoriu pentru consultații online." });
    }

    if (type === "fizic" && !room) {
      return res.status(400).json({ message: "Sala este obligatorie pentru consultații fizice." });
    }

    let professorId = req.user.id;
    if (req.user.role === "admin" && req.body.professorId) {
      professorId = req.body.professorId;
    }

    const consultationStatus = status || "published";
    const consultation = await Consultation.create({
      courseId,
      professorId,
      date,
      time,
      duration: duration || 120,
      type,
      room: room || null,
      meetingLink: meetingLink || null,
      materialsLink: materialsLink || null,
      status: consultationStatus,
      publishedAt: consultationStatus === "published" ? new Date() : null,
    });

    // Auto-enrollment: înscrie studenții care se potrivesc
    if (consultationStatus === "published") {
      await enrollMatchingStudentsInConsultation(consultation.id, courseId);
    }

    return res.status(201).json({ message: "Consultație creată cu succes.", consultation });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Editează o consultație (profesor / admin) — starea rămâne published
const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    if (req.user.role === "professor" && consultation.professorId !== req.user.id) {
      return res.status(403).json({ message: "Nu poți edita consultațiile altui profesor." });
    }

    if (consultation.status === "cancelled" || consultation.status === "completed") {
      return res.status(400).json({ message: "Nu poți edita o consultație anulată sau finalizată." });
    }

    const { date, time, duration, type, room, meetingLink, materialsLink } = req.body;

    if (date) consultation.date = date;
    if (time) consultation.time = time;
    if (duration) consultation.duration = duration;
    if (type) {
      consultation.type = type;
      if (type === "online") {
        consultation.room = null;
        if (meetingLink) consultation.meetingLink = meetingLink;
      } else {
        consultation.meetingLink = null;
        if (room) consultation.room = room;
      }
    }
    if (materialsLink !== undefined) consultation.materialsLink = materialsLink;

    await consultation.save();

    // Sincronizare Google Calendar — actualizează evenimentele studenților conectați
    syncAllForConsultation(consultation.id, "update");

    return res.status(200).json({ message: "Consultație actualizată cu succes.", consultation });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Anulează o consultație (profesor / admin)
const cancelConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    if (req.user.role === "professor" && consultation.professorId !== req.user.id) {
      return res.status(403).json({ message: "Nu poți anula consultațiile altui profesor." });
    }

    if (consultation.status !== "published") {
      return res.status(400).json({ message: "Doar consultațiile publicate pot fi anulate." });
    }

    consultation.status = "cancelled";
    consultation.cancelledAt = new Date();
    consultation.cancellationReason = req.body.cancellationReason || null;
    await consultation.save();

    // Trimite email de anulare studenților înscriși (asincron)
    sendCancellationEmails(consultation.id);

    // Sincronizare Google Calendar — șterge evenimentele studenților conectați
    syncAllForConsultation(consultation.id, "delete");

    return res.status(200).json({ message: "Consultație anulată cu succes.", consultation });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Finalizează o consultație (profesor / admin)
const completeConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    if (req.user.role === "professor" && consultation.professorId !== req.user.id) {
      return res.status(403).json({ message: "Nu poți finaliza consultațiile altui profesor." });
    }

    if (consultation.status !== "published") {
      return res.status(400).json({ message: "Doar consultațiile publicate pot fi finalizate." });
    }

    consultation.status = "completed";
    consultation.completedAt = new Date();
    await consultation.save();

    return res.status(200).json({ message: "Consultație finalizată cu succes.", consultation });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Șterge o consultație (profesor / admin) — ștergere permanentă din DB
const deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    if (req.user.role === "professor" && consultation.professorId !== req.user.id) {
      return res.status(403).json({ message: "Nu poți șterge consultațiile altui profesor." });
    }

    // Sincronizare Google Calendar — șterge evenimentele înainte de ștergerea din DB
    await syncAllForConsultation(consultation.id, "delete");

    await consultation.destroy();

    return res.status(200).json({ message: "Consultație ștearsă cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează consultațiile profesorului autentificat
const getMyConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.findAll({
      where: { professorId: req.user.id },
      include: [
        {
          model: Course,
          as: "course",
          include: [
            { model: Faculty, as: "faculty" },
            { model: Specialization, as: "specialization" },
          ],
        },
      ],
      order: [["date", "ASC"], ["time", "ASC"]],
    });

    return res.status(200).json(consultations);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Student se înscrie la o consultație (manual - pentru recuperări)
const enrollConsultation = async (req, res) => {
  try {
    const { consultationId } = req.body;

    const consultation = await Consultation.findByPk(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    if (consultation.status !== "published") {
      return res.status(400).json({ message: "Nu te poți înscrie la o consultație care nu este publicată." });
    }

    const existing = await UserConsultation.findOne({
      where: { userId: req.user.id, consultationId },
    });

    if (existing) {
      if (existing.status === "withdrawn") {
        // Re-înscriere după retragere
        existing.status = "active";
        existing.withdrawnAt = null;
        existing.enrolledAt = new Date();
        await existing.save();
        // Sincronizare Google Calendar — recreează eveniment
        createEvent(req.user.id, consultationId);
        return res.status(200).json({ message: "Te-ai re-înscris la consultație cu succes." });
      }
      return res.status(400).json({ message: "Ești deja înscris la această consultație." });
    }

    await UserConsultation.create({
      userId: req.user.id,
      consultationId,
      source: "manual",
      status: "active",
      enrolledAt: new Date(),
    });

    // Sincronizare Google Calendar — creează eveniment dacă studentul are calendar conectat
    createEvent(req.user.id, consultationId);

    return res.status(201).json({ message: "Te-ai înscris la consultație cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Student se retrage dintr-o consultație
const unenrollConsultation = async (req, res) => {
  try {
    const record = await UserConsultation.findOne({
      where: { userId: req.user.id, consultationId: req.params.id, source: "manual", status: "active" },
    });

    if (!record) {
      return res.status(404).json({ message: "Înscrierea nu a fost găsită sau nu poate fi eliminată." });
    }

    record.status = "withdrawn";
    record.withdrawnAt = new Date();
    await record.save();

    // Sincronizare Google Calendar — șterge evenimentul
    deleteEvent(req.user.id, parseInt(req.params.id));

    return res.status(200).json({ message: "Te-ai retras din consultație." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează consultațiile studentului (auto + manual)
const getStudentConsultations = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    // Consultațiile automate — pe baza anului și specializării
    const autoConsultations = await Consultation.findAll({
      where: { status: { [Op.in]: ["published", "cancelled", "completed"] } },
      include: [
        {
          model: Course,
          as: "course",
          where: { studyYear: user.studyYear, specializationId: user.specializationId },
          include: [
            { model: Faculty, as: "faculty" },
            { model: Specialization, as: "specialization" },
          ],
        },
        { model: User, as: "professor", attributes: ["id", "firstName", "lastName"] },
      ],
      order: [["date", "ASC"], ["time", "ASC"]],
    });

    // Consultațiile manuale — adăugate de student pentru recuperări
    const manualRecords = await UserConsultation.findAll({
      where: { userId: req.user.id, source: "manual", status: "active" },
    });
    const manualIds = manualRecords.map((r) => r.consultationId);

    let manualConsultations = [];
    if (manualIds.length) {
      manualConsultations = await Consultation.findAll({
        where: { id: manualIds },
        include: [
          {
            model: Course,
            as: "course",
            include: [
              { model: Faculty, as: "faculty" },
              { model: Specialization, as: "specialization" },
            ],
          },
          { model: User, as: "professor", attributes: ["id", "firstName", "lastName"] },
        ],
        order: [["date", "ASC"], ["time", "ASC"]],
      });
    }

    return res.status(200).json({
      auto: autoConsultations,
      manual: manualConsultations,
    });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  cancelConsultation,
  completeConsultation,
  deleteConsultation,
  getMyConsultations,
  enrollConsultation,
  unenrollConsultation,
  getStudentConsultations,
};
