import { formatDate, formatTime } from "../../../utils/formatDate";
import "./ConsultationCard.css";

const STATUS_COLORS = {
  cancelled: "#c0392b",
  completed: "#27ae60",
  published: "#667eea",
  online: "#667eea",
  fizic: "#2e7d32",
};

const ConsultationCard = ({ consultation: c, onClick, isPast }) => {
  const color =
    c.status === "cancelled"
      ? STATUS_COLORS.cancelled
      : c.status === "completed"
      ? STATUS_COLORS.completed
      : c.type === "online"
      ? STATUS_COLORS.online
      : STATUS_COLORS.fizic;

  const courseName = c.course?.name || c.courseName || "—";
  const professorName = c.professor
    ? `${c.professor.firstName || ""} ${c.professor.lastName || ""}`.trim()
    : c.professorName || "";

  return (
    <button
      className={[
        "consult-dash-card",
        c.status === "cancelled" ? "consult-dash-card--cancelled" : "",
        c.status === "completed" ? "consult-dash-card--completed" : "",
      ].filter(Boolean).join(" ")}
      style={{ "--card-color": color }}
      onClick={onClick}
    >
      <div className="consult-dash-card__top">
        <span className={`badge badge--${c.type}`}>
          {c.type === "online" ? "Online" : "Fizic"}
        </span>
        {c.status === "cancelled" && <span className="badge badge--cancelled">Anulat</span>}
        {c.status === "completed" && <span className="badge badge--completed">Finalizat</span>}
        {isPast && c.status === "published" && <span className="badge badge--draft">Inactiv</span>}
      </div>
      <h3 className="consult-dash-card__course">{courseName}</h3>
      {professorName && (
        <p className="consult-dash-card__professor">{professorName}</p>
      )}
      <div className="consult-dash-card__footer">
        <span className="consult-dash-card__date">{formatDate(c.date)}</span>
        <span className="consult-dash-card__time">
          {formatTime(c.startTime || c.time)}
        </span>
      </div>
    </button>
  );
};

export default ConsultationCard;
