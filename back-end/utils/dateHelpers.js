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
  return new Date(`${dateStr}T${timeStr}:00`);
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
