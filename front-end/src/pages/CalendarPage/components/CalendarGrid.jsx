import { useState, useEffect } from "react";
import { getMonthName, DAYS_RO } from "../../../utils/formatDate";
import "./CalendarGrid.css";

const DAYS_SHORT = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

const CalendarGrid = ({ consultations, selectedDate, onSelectDate, session }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const allowedMonths = session
    ? session.activeSession === "winter"
      ? session.winterMonths
      : session.summerMonths
    : null;

  const canGoPrev = !allowedMonths || allowedMonths.includes(currentMonth);
  const canGoNext = !allowedMonths || allowedMonths.includes(currentMonth + 2);

  const goToPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Luni = 0
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const consultationDates = new Set(
    consultations.map((c) => c.date)
  );

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatDateStr = (day) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    const [y, m, d] = formatDateStr(day).split("-").map(Number);
    onSelectDate(new Date(y, m - 1, d));
  };

  return (
    <div className="calendar-grid">
      <div className="calendar-grid__header">
        <button
          className="calendar-grid__nav"
          onClick={goToPrev}
          disabled={
            allowedMonths && currentMonth === Math.min(...allowedMonths) - 1
          }
        >
          ‹
        </button>
        <span className="calendar-grid__title">
          {getMonthName(currentMonth)} {currentYear}
        </span>
        <button
          className="calendar-grid__nav"
          onClick={goToNext}
          disabled={
            allowedMonths && currentMonth === Math.max(...allowedMonths) - 1
          }
        >
          ›
        </button>
      </div>

      <div className="calendar-grid__days-header">
        {DAYS_SHORT.map((d) => (
          <span key={d} className="calendar-grid__day-name">
            {d}
          </span>
        ))}
      </div>

      <div className="calendar-grid__cells">
        {cells.map((day, idx) => (
          <button
            key={idx}
            className={[
              "calendar-grid__cell",
              day === null ? "calendar-grid__cell--empty" : "",
              day && isToday(day) ? "calendar-grid__cell--today" : "",
              day && isSelected(day) ? "calendar-grid__cell--selected" : "",
              day && consultationDates.has(formatDateStr(day))
                ? "calendar-grid__cell--has-events"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => handleSelectDay(day)}
            disabled={!day}
          >
            {day && <span>{day}</span>}
            {day && consultationDates.has(formatDateStr(day)) && (
              <span className="calendar-grid__dot" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
