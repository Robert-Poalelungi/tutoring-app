const jwt = require("jsonwebtoken");
const { User, Faculty, Specialization, NotificationPreference } = require("../models");
const detectStudyYear = require("../utils/detectStudyYear");
const { enrollStudentInMatchingConsultations, recalculateAutoEnrollments } = require("../services/autoEnrollmentService");

// Returnează datele utilizatorului autentificat
const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "Nu ești autentificat." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Faculty, as: "faculty" },
        { model: Specialization, as: "specialization" },
        { model: NotificationPreference, as: "notificationPreference" },
      ],
    });
    if (!user.notificationPreference) {
      await NotificationPreference.create({ userId: user.id });
      user.notificationPreference = await NotificationPreference.findOne({ where: { userId: user.id } });
    }


    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const userData = user.toJSON();
    delete userData.driveAccessToken;
    delete userData.driveRefreshToken;
    userData.hasDriveAccess = Boolean(user.driveRefreshToken);
    userData.detectedStudyYear = detectStudyYear(user.email);
    userData.name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

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

    const { firstName, lastName, facultyId, specializationId, studyYear } = req.body;

    if (!firstName || !lastName || !facultyId || !specializationId || !studyYear) {
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
    user.facultyId = facultyId;
    user.specializationId = specializationId;
    user.studyYear = studyYear;
    user.isProfileCompleted = true;

    await user.save();

    // Auto-enrollment: înscrie studentul la consultațiile care se potrivesc
    if (user.role === "student") {
      await enrollStudentInMatchingConsultations(user.id, specializationId, studyYear);
    }

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

    const { firstName, lastName, facultyId, specializationId, studyYear, serie } = req.body;
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

    const profileChanged = (specializationId && specializationId !== user.specializationId) ||
      (studyYear && studyYear !== user.studyYear);

    if (facultyId) user.facultyId = facultyId;
    if (specializationId) user.specializationId = specializationId;
    if (studyYear) user.studyYear = studyYear;
    if (serie !== undefined) user.serie = serie || null;

    await user.save();

    // Recalculare auto-enrollment dacă s-au schimbat specializarea sau anul
    if (user.role === "student" && profileChanged) {
      await recalculateAutoEnrollments(user.id, user.specializationId, user.studyYear);
    }

    return res.status(200).json({ message: "Profil actualizat cu succes.", user });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

// Activează/dezactivează notificările pe email
const toggleEmailNotifications = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "Câmpul 'enabled' trebuie să fie true sau false." });
    }

    user.emailNotificationsEnabled = enabled;
    await user.save();

    return res.status(200).json({ message: "Preferință notificări actualizată.", emailNotificationsEnabled: user.emailNotificationsEnabled });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

const getNotificationSettings = async (req, res) => {
  try {
    const [preferences] = await NotificationPreference.findOrCreate({
      where: { userId: req.user.id },
      defaults: { userId: req.user.id },
    });

    return res.status(200).json({
      reminder1hour: preferences.reminder1hour,
      reminder1day: preferences.reminder1day,
      cancellation: preferences.cancellation,
    });
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { reminder1hour, reminder1day, cancellation } = req.body;

    const [preferences] = await NotificationPreference.findOrCreate({
      where: { userId: req.user.id },
      defaults: { userId: req.user.id },
    });

    if (typeof reminder1hour === "boolean") preferences.reminder1hour = reminder1hour;
    if (typeof reminder1day === "boolean") preferences.reminder1day = reminder1day;
    if (typeof cancellation === "boolean") preferences.cancellation = cancellation;

    await preferences.save();

    return res.status(200).json({
      message: "Preferințe notificări actualizate.",
      settings: {
        reminder1hour: preferences.reminder1hour,
        reminder1day: preferences.reminder1day,
        cancellation: preferences.cancellation,
      },
    });
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
  toggleEmailNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  setAuthCookie,
};
