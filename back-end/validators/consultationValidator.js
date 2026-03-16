const validStatuses = ["draft", "published", "cancelled", "completed"];
const validTypes = ["online", "fizic"];

const validateConsultationData = (data) => {
  const errors = [];

  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push("Data trebuie să fie în formatul YYYY-MM-DD.");
    }
  }

  if (data.time) {
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(data.time)) {
      errors.push("Ora trebuie să fie în formatul HH:MM.");
    }
  }

  if (data.duration) {
    if (!Number.isInteger(data.duration) || data.duration < 1) {
      errors.push("Durata trebuie să fie un număr întreg pozitiv (minute).");
    }
  }

  if (data.type && !validTypes.includes(data.type)) {
    errors.push("Tipul consultației trebuie să fie 'online' sau 'fizic'.");
  }

  if (data.type === "fizic" && !data.room) {
    errors.push("Sala este obligatorie pentru consultațiile fizice.");
  }

  if (data.type === "online" && !data.meetingLink) {
    errors.push("Link-ul de meeting este obligatoriu pentru consultațiile online.");
  }

  if (data.status && !validStatuses.includes(data.status)) {
    errors.push("Status invalid.");
  }

  return errors;
};

const validateCreateConsultation = (data) => {
  const { courseId, date, time, type } = data;

  if (!courseId || !date || !time || !type) {
    return ["Câmpurile courseId, date, time și type sunt obligatorii."];
  }

  return validateConsultationData(data);
};

module.exports = {
  validateConsultationData,
  validateCreateConsultation,
};
