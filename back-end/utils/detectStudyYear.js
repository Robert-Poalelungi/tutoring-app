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

module.exports = detectStudyYear;
