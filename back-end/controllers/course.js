const { Course, User, Faculty, Specialization, ProfessorCourse } = require("../models");

// Returnează toate materiile
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: Faculty, as: "faculty" },
        { model: Specialization, as: "specialization" },
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Profesorul autentificat își atribuie o materie
const assignCourseToProfessor = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId este obligatoriu." });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Materia nu a fost găsită." });
    }

    const existing = await ProfessorCourse.findOne({
      where: { professorId: req.user.id, courseId },
    });

    if (existing) {
      return res.status(200).json({ message: "Materia este deja atribuită profesorului.", alreadyAssigned: true });
    }

    await ProfessorCourse.create({ professorId: req.user.id, courseId });

    return res.status(201).json({ message: "Materie atribuită cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează o materie după ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{ association: "professors", attributes: ["id", "firstName", "lastName", "email"] }],
    });

    if (!course) {
      return res.status(404).json({ message: "Materia nu a fost găsită." });
    }

    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează materiile filtrate pe an și specializare
const getCoursesByFilter = async (req, res) => {
  try {
    const { studyYear, specializationId } = req.query;
    const where = {};

    if (studyYear) where.studyYear = studyYear;
    if (specializationId) where.specializationId = specializationId;

    const courses = await Course.findAll({
      where,
      include: [
        { model: Faculty, as: "faculty" },
        { model: Specialization, as: "specialization" },
      ],
    });

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează materiile atribuite unui profesor
const getProfessorCourses = async (req, res) => {
  try {
    const professor = await User.findByPk(req.user.id, {
      include: [
        {
          association: "courses",
          include: [
            { model: Faculty, as: "faculty" },
            { model: Specialization, as: "specialization" },
          ],
        },
      ],
    });

    if (!professor) {
      return res.status(404).json({ message: "Profesorul nu a fost găsit." });
    }

    return res.status(200).json(professor.courses);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesByFilter,
  getProfessorCourses,
  assignCourseToProfessor,
};
