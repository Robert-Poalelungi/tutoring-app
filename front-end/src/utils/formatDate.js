const MONTHS_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

const DAYS_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_RO[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
};

export const getDayName = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS_RO[d.getDay()];
};

export const getMonthName = (monthIndex) => MONTHS_RO[monthIndex];

export { MONTHS_RO, DAYS_RO };
