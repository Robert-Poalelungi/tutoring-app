const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Detectează anul de studiu din emailul instituțional
// poalelungirobert23@stud.ase.ro → 23 → 2023 → anul 3 (în 2026)
const detectStudyYear = (email) => {
  const match = email.match(/(\d{2})@stud\./);
  if (!match) return null;

  const startYear = 2000 + parseInt(match[1]);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Anul universitar începe în octombrie
  let studyYear = currentYear - startYear;
  if (currentMonth >= 10) studyYear += 1;

  // Dacă e în afara intervalului 1-4, returnăm null (absolvent sau invalid)
  if (studyYear < 1 || studyYear > 4) return null;

  return studyYear;
};

// Returnează datele utilizatorului autentificat
const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "Nu ești autentificat." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const userData = user.toJSON();
    userData.detectedStudyYear = detectStudyYear(user.email);

    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Completează profilul utilizatorului (onboarding)
const completeProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const { firstName, lastName, faculty, specialization, studyYear } = req.body;

    if (!firstName || !lastName || !faculty || !specialization || !studyYear) {
      return res.status(400).json({ message: "Toate câmpurile sunt obligatorii." });
    }

    const nameRegex = /^[A-Za-zĂăÂâÎîȘșȚț\s-]+$/;

    if (!nameRegex.test(firstName)) {
      return res.status(400).json({ message: "Prenumele conține caractere invalide." });
    }

    if (!nameRegex.test(lastName)) {
      return res.status(400).json({ message: "Numele conține caractere invalide." });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.faculty = faculty;
    user.specialization = specialization;
    user.studyYear = studyYear;
    user.isProfileCompleted = true;

    await user.save();

    return res.status(200).json({ message: "Profil completat cu succes.", user });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Actualizează profilul utilizatorului
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const { firstName, lastName, faculty, specialization, studyYear } = req.body;
    const nameRegex = /^[A-Za-zĂăÂâÎîȘșȚț\s-]+$/;

    if (firstName) {
      if (!nameRegex.test(firstName)) {
        return res.status(400).json({ message: "Prenumele conține caractere invalide." });
      }
      user.firstName = firstName;
    }

    if (lastName) {
      if (!nameRegex.test(lastName)) {
        return res.status(400).json({ message: "Numele conține caractere invalide." });
      }
      user.lastName = lastName;
    }

    if (faculty) user.faculty = faculty;
    if (specialization) user.specialization = specialization;
    if (studyYear) user.studyYear = studyYear;

    await user.save();

    return res.status(200).json({ message: "Profil actualizat cu succes.", user });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Creează JWT și setează cookie-ul
const setAuthCookie = (user, res) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "5h" }
  );

  const cookieOptions = {
    httpOnly: true,
    maxAge: parseInt(process.env.COOKIE_AGE) || 18000000,
  };

  if (process.env.SITE_MODE !== "dev") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "none";
  }

  res.cookie("access_token", token, cookieOptions);

  return token;
};

module.exports = {
  getCurrentUser,
  completeProfile,
  updateProfile,
  setAuthCookie,
  detectStudyYear,
};
