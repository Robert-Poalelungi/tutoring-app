const { Consultation, Course, UserConsultation } = require("../models");
const { Op } = require("sequelize");

// Înscrie automat un student la consultațiile care corespund profilului său
const enrollStudentInMatchingConsultations = async (userId, specializationId, studyYear) => {
  // Găsește toate consultațiile publicate pentru cursurile care se potrivesc
  const matchingConsultations = await Consultation.findAll({
    where: { status: "published" },
    include: [
      {
        model: Course,
        as: "course",
        where: { specializationId, studyYear },
        attributes: ["id"],
      },
    ],
    attributes: ["id"],
  });

  const consultationIds = matchingConsultations.map((c) => c.id);

  if (!consultationIds.length) return;

  // Verifică ce consultații are deja studentul (auto)
  const existingEnrollments = await UserConsultation.findAll({
    where: {
      userId,
      consultationId: { [Op.in]: consultationIds },
      source: "auto",
    },
    attributes: ["consultationId"],
  });

  const existingIds = new Set(existingEnrollments.map((e) => e.consultationId));

  // Creează înregistrări doar pentru consultațiile noi
  const newEnrollments = consultationIds
    .filter((id) => !existingIds.has(id))
    .map((consultationId) => ({
      userId,
      consultationId,
      source: "auto",
      status: "active",
      enrolledAt: new Date(),
    }));

  if (newEnrollments.length) {
    await UserConsultation.bulkCreate(newEnrollments);
  }
};

// Recalculează auto-enrollment-urile după schimbarea profilului
const recalculateAutoEnrollments = async (userId, specializationId, studyYear) => {
  // Găsește consultațiile care ar trebui să fie auto-enrolled
  const matchingConsultations = await Consultation.findAll({
    where: { status: "published" },
    include: [
      {
        model: Course,
        as: "course",
        where: { specializationId, studyYear },
        attributes: ["id"],
      },
    ],
    attributes: ["id"],
  });

  const matchingIds = new Set(matchingConsultations.map((c) => c.id));

  // Toate auto-enrollment-urile existente ale studentului
  const currentAutoEnrollments = await UserConsultation.findAll({
    where: { userId, source: "auto" },
  });

  // Dezactivează cele care nu mai corespund
  for (const enrollment of currentAutoEnrollments) {
    if (!matchingIds.has(enrollment.consultationId) && enrollment.status === "active") {
      enrollment.status = "withdrawn";
      enrollment.withdrawnAt = new Date();
      await enrollment.save();
    }
  }

  // Adaugă/reactivează cele noi
  const existingMap = new Map(currentAutoEnrollments.map((e) => [e.consultationId, e]));

  for (const consultationId of matchingIds) {
    const existing = existingMap.get(consultationId);

    if (!existing) {
      // Consultație nouă — creează enrollment
      await UserConsultation.create({
        userId,
        consultationId,
        source: "auto",
        status: "active",
        enrolledAt: new Date(),
      });
    } else if (existing.status === "withdrawn") {
      // Re-activează dacă era dezactivată
      existing.status = "active";
      existing.withdrawnAt = null;
      existing.enrolledAt = new Date();
      await existing.save();
    }
  }
};

// Înscrie automat studenții relevanți la o consultație nou creată
const enrollMatchingStudentsInConsultation = async (consultationId, courseId) => {
  const course = await Course.findByPk(courseId, {
    attributes: ["specializationId", "studyYear"],
  });

  if (!course) return;

  // Găsește studenții cu profil completat care se potrivesc
  const { User } = require("../models");
  const matchingStudents = await User.findAll({
    where: {
      role: "student",
      isProfileCompleted: true,
      specializationId: course.specializationId,
      studyYear: course.studyYear,
    },
    attributes: ["id"],
  });

  if (!matchingStudents.length) return;

  const studentIds = matchingStudents.map((s) => s.id);

  // Verifică ce studenți sunt deja înscriși
  const existingEnrollments = await UserConsultation.findAll({
    where: {
      consultationId,
      userId: { [Op.in]: studentIds },
    },
    attributes: ["userId"],
  });

  const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));

  const newEnrollments = studentIds
    .filter((id) => !existingUserIds.has(id))
    .map((userId) => ({
      userId,
      consultationId,
      source: "auto",
      status: "active",
      enrolledAt: new Date(),
    }));

  if (newEnrollments.length) {
    await UserConsultation.bulkCreate(newEnrollments);
  }
};

module.exports = {
  enrollStudentInMatchingConsultations,
  recalculateAutoEnrollments,
  enrollMatchingStudentsInConsultation,
};
