const { User, Course, ProfessorCourse } = require("../models");

// ─── USERS ───

// Returnează toți utilizatorii
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Returnează un utilizator după ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Creează un utilizator nou
const createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, faculty, specialization, studyYear } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ message: "Email, nume, prenume și rol sunt obligatorii." });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Un utilizator cu acest email există deja." });
    }

    const user = await User.create({
      email,
      firstName,
      lastName,
      role,
      faculty: faculty || null,
      specialization: specialization || null,
      studyYear: studyYear || null,
      isProfileCompleted: true,
    });

    return res.status(201).json({ message: "Utilizator creat cu succes.", user });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Modifică rolul unui utilizator
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const { role } = req.body;

    if (!["student", "professor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rol invalid. Folosește: student, professor sau admin." });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({ message: "Rol actualizat cu succes.", user });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Șterge un utilizator
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    await user.destroy();

    return res.status(200).json({ message: "Utilizator șters cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// ─── COURSES ───

// Creează o materie nouă
const createCourse = async (req, res) => {
  try {
    const { name, specialization, studyYear } = req.body;

    if (!name || !specialization || !studyYear) {
      return res.status(400).json({ message: "Numele, specializarea și anul sunt obligatorii." });
    }

    const course = await Course.create({ name, specialization, studyYear });

    return res.status(201).json({ message: "Materie creată cu succes.", course });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Actualizează o materie
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Materia nu a fost găsită." });
    }

    const { name, specialization, studyYear } = req.body;

    if (name) course.name = name;
    if (specialization) course.specialization = specialization;
    if (studyYear) course.studyYear = studyYear;

    await course.save();

    return res.status(200).json({ message: "Materie actualizată cu succes.", course });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Șterge o materie
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Materia nu a fost găsită." });
    }

    await course.destroy();

    return res.status(200).json({ message: "Materie ștearsă cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// ─── PROFESSOR ↔ COURSES ───

// Atribuie o materie unui profesor
const assignCourse = async (req, res) => {
  try {
    const professorId = req.params.id;
    const { courseId } = req.body;

    const professor = await User.findByPk(professorId);
    if (!professor || professor.role !== "professor") {
      return res.status(404).json({ message: "Profesorul nu a fost găsit sau nu are rol de profesor." });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Materia nu a fost găsită." });
    }

    const existing = await ProfessorCourse.findOne({
      where: { professorId, courseId },
    });

    if (existing) {
      return res.status(400).json({ message: "Profesorul are deja atribuită această materie." });
    }

    await ProfessorCourse.create({ professorId, courseId });

    return res.status(201).json({ message: "Materie atribuită profesorului cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Elimină atribuirea unei materii de la un profesor
const unassignCourse = async (req, res) => {
  try {
    const professorId = req.params.id;
    const { courseId } = req.body;

    const record = await ProfessorCourse.findOne({
      where: { professorId, courseId },
    });

    if (!record) {
      return res.status(404).json({ message: "Atribuirea nu a fost găsită." });
    }

    await record.destroy();

    return res.status(200).json({ message: "Materie eliminată de la profesor cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserRole,
  deleteUser,
  createCourse,
  updateCourse,
  deleteCourse,
  assignCourse,
  unassignCourse,
};
