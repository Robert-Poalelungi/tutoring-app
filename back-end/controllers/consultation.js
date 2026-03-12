const { Consultation, Course, User, UserConsultation } = require("../models");

// Returnează toate consultațiile (public - pentru calendar)
const getAllConsultations = async (req, res) => {
  try {
    const { studyYear, specialization, faculty } = req.query;
    const courseWhere = {};

    if (studyYear) courseWhere.studyYear = studyYear;
    if (specialization) courseWhere.specialization = specialization;

    const consultations = await Consultation.findAll({
      include: [
        { association: "course", where: Object.keys(courseWhere).length ? courseWhere : undefined },
        { association: "professor", attributes: ["id", "firstName", "lastName"] },
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
        { association: "course" },
        { association: "professor", attributes: ["id", "firstName", "lastName"] },
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
    const { courseId, date, time, type, room, meetingLink, materialsLink } = req.body;

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

    // Profesorul care creează consultația este cel autentificat,
    // sau adminul poate specifica un profesorId
    let professorId = req.user.id;
    if (req.user.role === "admin" && req.body.professorId) {
      professorId = req.body.professorId;
    }

    const consultation = await Consultation.create({
      courseId,
      professorId,
      date,
      time,
      type,
      room: room || null,
      meetingLink: meetingLink || null,
      materialsLink: materialsLink || null,
    });

    return res.status(201).json({ message: "Consultație creată cu succes.", consultation });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Editează o consultație (profesor / admin)
const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    // Profesorul poate edita doar consultațiile proprii
    if (req.user.role === "professor" && consultation.professorId !== req.user.id) {
      return res.status(403).json({ message: "Nu poți edita consultațiile altui profesor." });
    }

    const { date, time, type, room, meetingLink, materialsLink } = req.body;

    if (date) consultation.date = date;
    if (time) consultation.time = time;
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

    return res.status(200).json({ message: "Consultație actualizată cu succes.", consultation });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Șterge o consultație (profesor / admin)
const deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    if (req.user.role === "professor" && consultation.professorId !== req.user.id) {
      return res.status(403).json({ message: "Nu poți șterge consultațiile altui profesor." });
    }

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
      include: [{ association: "course" }],
    });

    return res.status(200).json(consultations);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Student adaugă o consultație la lista sa (manual - pentru recuperări)
const enrollConsultation = async (req, res) => {
  try {
    const { consultationId } = req.body;

    const consultation = await Consultation.findByPk(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultația nu a fost găsită." });
    }

    const existing = await UserConsultation.findOne({
      where: { userId: req.user.id, consultationId },
    });

    if (existing) {
      return res.status(400).json({ message: "Ești deja înscris la această consultație." });
    }

    await UserConsultation.create({
      userId: req.user.id,
      consultationId,
      source: "manual",
    });

    return res.status(201).json({ message: "Te-ai înscris la consultație cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Student elimină o consultație din lista sa
const unenrollConsultation = async (req, res) => {
  try {
    const record = await UserConsultation.findOne({
      where: { userId: req.user.id, consultationId: req.params.id, source: "manual" },
    });

    if (!record) {
      return res.status(404).json({ message: "Înscrierea nu a fost găsită sau nu poate fi eliminată." });
    }

    await record.destroy();

    return res.status(200).json({ message: "Consultație eliminată din lista ta." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează consultațiile studentului (auto + manual)
const getStudentConsultations = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    // Consultațiile automate - pe baza anului și specializării
    const autoConsultations = await Consultation.findAll({
      include: [
        {
          association: "course",
          where: { studyYear: user.studyYear, specialization: user.specialization },
        },
        { association: "professor", attributes: ["id", "firstName", "lastName"] },
      ],
    });

    // Consultațiile manuale - adăugate de student pentru recuperări
    const manualRecords = await UserConsultation.findAll({
      where: { userId: req.user.id, source: "manual" },
    });
    const manualIds = manualRecords.map((r) => r.consultationId);

    let manualConsultations = [];
    if (manualIds.length) {
      manualConsultations = await Consultation.findAll({
        where: { id: manualIds },
        include: [
          { association: "course" },
          { association: "professor", attributes: ["id", "firstName", "lastName"] },
        ],
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
  deleteConsultation,
  getMyConsultations,
  enrollConsultation,
  unenrollConsultation,
  getStudentConsultations,
};
