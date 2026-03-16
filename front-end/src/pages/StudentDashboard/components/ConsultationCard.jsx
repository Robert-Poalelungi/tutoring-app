import { formatDate, formatTime } from "../../../utils/formatDate";
import "./ConsultationCard.css";

const getCardColor = (consultation) => {
  if (consultation.status === "cancelled") return "#c0392b";
  if (consultation.status === "completed") return "#27ae60";
  if (consultation.type === "fizic") return "#2e7d32";
  return "#667eea";
};

const ConsultationCard = ({ consultation, onClick }) => {
  const cardColor = getCardColor(consultation);

  const courseName = consultation.Course?.name ?? "Curs necunoscut";
  const professorName =
    consultation.Professor?.User?.name ??
    consultation.Professor?.name ??
    consultation.professorName ??
    "Profesor necunoscut";

  return (
    <div
      className="consultation-card"
      style={{ "--card-color": cardColor }}
      onClick={onClick}
    >
      <div className="consultation-card__course">{courseName}</div>
      <div className="consultation-card__professor">{professorName}</div>

      <div className="consultation-card__time">
        <span>📅 {formatDate(consultation.date)}</span>
        <span>
          {formatTime(consultation.startTime)} – {formatTime(consultation.endTime)}
        </span>
      </div>

      <div className="consultation-card__badges">
        {consultation.type === "online" && (
          <span className="badge badge--online">Online</span>
        )}
        {consultation.type === "fizic" && (
          <span className="badge badge--fizic">Fizic</span>
        )}
        {consultation.status === "cancelled" && (
          <span className="badge badge--cancelled">Anulată</span>
        )}
        {consultation.status === "completed" && (
          <span className="badge badge--completed">Finalizată</span>
        )}
        {consultation.status === "published" && (
          <span className="badge badge--published">Programată</span>
        )}
      </div>
    </div>
  );
};

export default ConsultationCard;
