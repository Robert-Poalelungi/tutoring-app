const { Consultation, Course, UserConsultation, User } = require("../models");
const { Op } = require("sequelize");

// Înscrie automat un student la consultațiile care corespund profilului său
const enrollStudentInMatchingConsultations = async (userId, specializationId, studyYear) => {
  // Obține seria studentului pentru filtrare
  const user = await User.findByPk(userId, { attributes: ["serie"] });
  const userSerie = user ? user.serie : null;

  // Filtru serie: consultațiile "Toate" sunt valabile oricui; cele specifice doar studentilor cu seria respectivă
  const serieFilter = userSerie
    ? { [Op.or]: [{ serie: "Toate" }, { serie: userSerie }] }
    : { serie: "Toate" };

  // Găsește toate consultațiile publicate pentru cursurile care se potrivesc
  const matchingConsultations = await Consultation.findAll({
    where: { status: "published", ...serieFilter },
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
  // Obține seria actualizată a studentului
  const user = await User.findByPk(userId, { attributes: ["serie"] });
  const userSerie = user ? user.serie : null;

  const serieFilter = userSerie
    ? { [Op.or]: [{ serie: "Toate" }, { serie: userSerie }] }
    : { serie: "Toate" };

  // Găsește consultațiile care ar trebui să fie auto-enrolled
  const matchingConsultations = await Consultation.findAll({
    where: { status: "published", ...serieFilter },
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
  const consultation = await Consultation.findByPk(consultationId, {
    attributes: ["serie"],
  });

  const course = await Course.findByPk(courseId, {
    attributes: ["specializationId", "studyYear"],
  });

  if (!course) return;

  // Filtrare pe serie: dacă consultația e pentru o serie specifică, înscrie doar studenții din acea serie
  const studentWhere = {
    role: "student",
    isProfileCompleted: true,
    specializationId: course.specializationId,
    studyYear: course.studyYear,
  };

  if (consultation && consultation.serie && consultation.serie !== "Toate") {
    studentWhere.serie = consultation.serie;
  }

  // Găsește studenții cu profil completat care se potrivesc
  const matchingStudents = await User.findAll({
    where: studentWhere,
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
