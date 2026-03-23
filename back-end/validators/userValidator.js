const nameRegex = /^[A-Za-zĂăÂâÎîȘșȚț\s-]+$/;

const validateProfileData = (data) => {
  const errors = [];

  if (data.firstName && !nameRegex.test(data.firstName)) {
    errors.push("Prenumele conține caractere invalide.");
  }

  if (data.lastName && !nameRegex.test(data.lastName)) {
    errors.push("Numele conține caractere invalide.");
  }

  if (data.studyYear && (data.studyYear < 1 || data.studyYear > 3)) {
    errors.push("Anul de studiu trebuie să fie între 1 și 3.");
  }

  return errors;
};

const validateOnboardingData = (data) => {
  const { firstName, lastName, facultyId, specializationId, studyYear } = data;

  if (!firstName || !lastName || !facultyId || !specializationId || !studyYear) {
    return ["Toate câmpurile sunt obligatorii."];
  }

  return validateProfileData(data);
};

module.exports = {
  validateProfileData,
  validateOnboardingData,
};
