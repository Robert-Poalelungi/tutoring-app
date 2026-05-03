const { User, Course, ProfessorCourse, Faculty, Specialization, CalendarSessions } = require("../models");
const sequelize = require("../config/db");

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
    const { email, firstName, lastName, role, facultyId, specializationId, studyYear } = req.body;

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
      facultyId: facultyId || null,
      specializationId: specializationId || null,
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
    const { name, facultyId, specializationId, studyYear } = req.body;

    if (!name || !facultyId || !specializationId || !studyYear) {
      return res.status(400).json({ message: "Numele, facultatea, specializarea și anul sunt obligatorii." });
    }

    const course = await Course.create({ name, facultyId, specializationId, studyYear });

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

    const { name, facultyId, specializationId, studyYear } = req.body;

    if (name) course.name = name;
    if (facultyId) course.facultyId = facultyId;
    if (specializationId) course.specializationId = specializationId;
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

// ─── FACULTIES ───

// Returnează toate facultățile
const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.findAll({ order: [["name", "ASC"]] });
    return res.status(200).json(faculties);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Creează o facultate nouă
const createFaculty = async (req, res) => {
  try {
    const { name, abbreviation } = req.body;

    if (!name || !abbreviation) {
      return res.status(400).json({ message: "Numele și abrevierea sunt obligatorii." });
    }

    const faculty = await Faculty.create({ name, abbreviation });
    return res.status(201).json({ message: "Facultate creată cu succes.", faculty });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Editează o facultate
const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: "Facultatea nu a fost găsită." });
    }

    const { name, abbreviation } = req.body;
    if (name) faculty.name = name;
    if (abbreviation) faculty.abbreviation = abbreviation;

    await faculty.save();
    return res.status(200).json({ message: "Facultate actualizată cu succes.", faculty });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Șterge o facultate
const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: "Facultatea nu a fost găsită." });
    }

    await faculty.destroy();
    return res.status(200).json({ message: "Facultate ștearsă cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// ─── SPECIALIZATIONS ───

// Returnează toate specializările
const getAllSpecializations = async (req, res) => {
  try {
    const specializations = await Specialization.findAll({
      include: [{ model: Faculty, as: "faculty" }],
      order: [["name", "ASC"]],
    });
    return res.status(200).json(specializations);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Creează o specializare nouă
const createSpecialization = async (req, res) => {
  try {
    const { name, facultyId } = req.body;

    if (!name || !facultyId) {
      return res.status(400).json({ message: "Numele și facultatea sunt obligatorii." });
    }

    const faculty = await Faculty.findByPk(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: "Facultatea nu a fost găsită." });
    }

    const specialization = await Specialization.create({ name, facultyId });
    return res.status(201).json({ message: "Specializare creată cu succes.", specialization });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Editează o specializare
const updateSpecialization = async (req, res) => {
  try {
    const specialization = await Specialization.findByPk(req.params.id);

    if (!specialization) {
      return res.status(404).json({ message: "Specializarea nu a fost găsită." });
    }

    const { name, facultyId } = req.body;
    if (name) specialization.name = name;
    if (facultyId) specialization.facultyId = facultyId;

    await specialization.save();
    return res.status(200).json({ message: "Specializare actualizată cu succes.", specialization });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Șterge o specializare
const deleteSpecialization = async (req, res) => {
  try {
    const specialization = await Specialization.findByPk(req.params.id);

    if (!specialization) {
      return res.status(404).json({ message: "Specializarea nu a fost găsită." });
    }

    await specialization.destroy();
    return res.status(200).json({ message: "Specializare ștearsă cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// ─── SETTINGS ───

// Returnează setările aplicației
const getSettings = async (req, res) => {
  try {
    let session = await CalendarSessions.findByPk(1);

    if (!session) {
      session = await CalendarSessions.create({
        id: 1,
        activeSession: "winter",
        winterMonths: [1, 2],
        summerMonths: [6, 7],
      });
    }

    let seasonalTheme = true;
    try {
      const [rows] = await sequelize.query(
        "SELECT `seasonalTheme` FROM `CalendarSessions` WHERE `id` = 1;"
      );
      if (rows.length > 0) seasonalTheme = rows[0].seasonalTheme !== 0;
    } catch (_) {}

    return res.status(200).json({ session: { ...session.toJSON(), seasonalTheme } });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Schimbă sesiunea activă
const updateSession = async (req, res) => {
  try {
    const { activeSession, seasonalTheme } = req.body;

    if (activeSession !== undefined && !["winter", "summer"].includes(activeSession)) {
      return res.status(400).json({ message: "Sesiunea trebuie să fie 'winter' sau 'summer'." });
    }

    let session = await CalendarSessions.findByPk(1);

    if (!session) {
      session = await CalendarSessions.create({
        id: 1,
        activeSession: activeSession || "winter",
        winterMonths: [1, 2],
        summerMonths: [6, 7],
        updatedBy: req.user.id,
      });
    } else if (activeSession !== undefined) {
      await session.update({ activeSession, updatedBy: req.user.id });
    }

    // seasonalTheme via raw query (coloana nu e în model)
    if (seasonalTheme !== undefined) {
      try {
        await sequelize.query(
          "UPDATE `CalendarSessions` SET `seasonalTheme` = ? WHERE `id` = 1;",
          { replacements: [seasonalTheme ? 1 : 0] }
        );
      } catch (_) {}
    }

    return res.status(200).json({ message: "Sesiune actualizată cu succes." });
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
  getAllFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getAllSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  getSettings,
  updateSession,
};
