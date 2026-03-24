import { useState, useEffect } from "react";
import { getMonthName } from "../../../utils/formatDate";
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
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const consultationDates = new Set(consultations.map((c) => c.date));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatDateStr = (day) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const selStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div className="cal-month-tabs">
          {allowedMonths?.map((m) => (
            <button
              key={m}
              type="button"
              className={`cal-month-tab ${currentMonth === m ? "active" : ""}`}
              onClick={() => { setCurrentMonth(m); setCurrentYear(new Date().getFullYear()); }}
            >
              {getMonthName(m)}
            </button>
          ))}
        </div>
        <h2 className="cal-month-year">{getMonthName(currentMonth)} {currentYear}</h2>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button type="button" className="cal-nav-btn" onClick={goToPrev}><i className="fa-solid fa-chevron-left" /></button>
          <button type="button" className="cal-nav-btn" onClick={goToNext}><i className="fa-solid fa-chevron-right" /></button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {DAYS_SHORT.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="calendar-days">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-day empty" />;
          const dateStr = formatDateStr(day);
          const isToday = dateStr === todayStr;
          const isSel = dateStr === selStr;
          const hasEvents = consultationDates.has(dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              className={`cal-day ${isToday ? "today" : ""} ${isSel ? "selected" : ""} ${hasEvents ? "has-events" : ""}`}
              onClick={() => onSelectDate(new Date(dateStr + "T00:00:00"))}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
