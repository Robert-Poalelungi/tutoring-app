import { formatDate, formatTime } from "../../../utils/formatDate";
import "./ConsultationCard.css";

const ConsultationCard = ({ consultation: c, onClick, isPast }) => {
  const course = c.course?.name || c.courseName || "—";
  const professor = c.professor
    ? `${c.professor.firstName || ""} ${c.professor.lastName || ""}`.trim()
    : c.professorName || "—";

  return (
    <div className={`consult-card ${isPast ? "consult-card--past" : ""}`} onClick={onClick}>
      <div className="consult-card__course">{course}</div>
      <div className="consult-card__professor">
        <i className="fa-solid fa-user-tie" /> {professor}
      </div>
      <div className="consult-card__date">
        <i className="fa-regular fa-calendar" /> {formatDate(c.date)}
        {c.startTime && <span> · {formatTime(c.startTime)}</span>}
      </div>
      <div className="consult-card__actions">
        <button type="button" className="consult-card__btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Detalii
        </button>
      </div>
    </div>
  );
};

export default ConsultationCard;
