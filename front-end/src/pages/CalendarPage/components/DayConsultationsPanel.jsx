import { getMonthName } from "../../../utils/formatDate";
import "./DayConsultationsPanel.css";

const DAYS_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

const DayConsultationsPanel = ({ date, consultations, loading, onSelect }) => {
  const dayName = DAYS_RO[date.getDay()];
  const dayNum = date.getDate();
  const monthName = getMonthName(date.getMonth());

  return (
    <div className="day-panel">
      <h2 className="day-panel__title">{dayName}</h2>
      <p className="day-panel__subtitle">{dayNum} {monthName}</p>

      {loading ? (
        <div className="loading-spinner" />
      ) : consultations.length === 0 ? (
        <p className="day-panel__empty">Nicio consultație în această zi.</p>
      ) : (
        <div className="day-panel__list">
          {consultations.map((c) => {
            const hour = c.startTime ? c.startTime.slice(0, 5) : "—";
            const course = c.course?.name || c.courseName || "—";
            const prof = c.professor
              ? `${c.professor.firstName || ""} ${c.professor.lastName || ""}`.trim()
              : c.professorName || "—";
            return (
              <div key={c.id} className="consult-item" onClick={() => onSelect(c)}>
                <div className="consult-item__hour">{hour}</div>
                <div className="consult-item__details">
                  <div className="consult-item__subject">{course}</div>
                  <div className="consult-item__professor">{prof}</div>
                  <div className="consult-item__actions">
                    <button type="button" className="consult-item__btn" onClick={(e) => { e.stopPropagation(); onSelect(c); }}>
                      Detalii
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DayConsultationsPanel;
