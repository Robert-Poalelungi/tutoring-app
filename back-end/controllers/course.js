const { Course, User, Faculty, Specialization } = require("../models");

// Returnează toate materiile
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();

    return res.status(200).json(courses);
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
      include: [{ association: "courses" }],
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
};
