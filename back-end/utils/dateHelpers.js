// Calculează ora de sfârșit din ora de start + durată (minute)
// "14:00" + 120 → "16:00"
const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
};

// Combină o dată (YYYY-MM-DD) și o oră (HH:MM) într-un obiect Date
const combineDateAndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    return new Date(NaN);
  }

  // Suportă atât HH:MM, cât și HH:MM:SS (formatul uzual din DB pentru TIME)
  const [hoursRaw, minutesRaw] = String(timeStr).split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return new Date(NaN);
  }

  const [yearRaw, monthRaw, dayRaw] = String(dateStr).split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return new Date(NaN);
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

// Verifică dacă o consultație este în viitor
const isInFuture = (dateStr, timeStr) => {
  const consultationDate = combineDateAndTime(dateStr, timeStr);
  return consultationDate > new Date();
};

module.exports = {
  calculateEndTime,
  combineDateAndTime,
  isInFuture,
};
