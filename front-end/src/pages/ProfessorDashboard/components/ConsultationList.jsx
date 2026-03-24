import { formatDate, formatTime } from "../../../utils/formatDate";
import "./ConsultationList.css";

const STATUS_LABELS = {
  published: "Publicată",
  cancelled: "Anulată",
  completed: "Finalizată",
};

const TYPE_LABELS = {
  online: "Online",
  fizic: "Fizic",
};

const ConsultationRow = ({ consultation, onEdit, onCancel, onComplete, onDelete }) => {
  const { id, startTime, endTime, courseName, type, status } = consultation;
  const isActive = status === "published";
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";

  return (
    <div className="prof-card">
      <div className="prof-card__course">{courseName}</div>
      <div className="prof-card__meta">
        <span><i className="fa-regular fa-clock" /> {formatTime(startTime)} – {formatTime(endTime)}</span>
        <span className={`badge badge--${type}`}>{TYPE_LABELS[type] ?? type}</span>
        <span className={`badge badge--${status}`}>{STATUS_LABELS[status] ?? status}</span>
      </div>
      <div className="prof-card__actions">
        {isActive && (
          <button type="button" className="prof-card__btn prof-card__btn--edit" onClick={() => onEdit(consultation)}>
            Editează
          </button>
        )}
        {isActive && (
          <button type="button" className="prof-card__btn prof-card__btn--complete" onClick={() => onComplete(id)}>
            Finalizează
          </button>
        )}
        {isActive && (
          <button type="button" className="prof-card__btn prof-card__btn--cancel" onClick={() => onCancel(id)}>
            Anulează
          </button>
        )}
        {(isCancelled || isCompleted) && (
          <button type="button" className="prof-card__btn prof-card__btn--cancel" onClick={() => onDelete(id)}>
            Șterge
          </button>
        )}
      </div>
    </div>
  );
};

const ConsultationList = ({ consultations, onEdit, onCancel, onComplete, onDelete }) => {
  if (!consultations || consultations.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">📋</span>
        <span className="empty-state__title">Nicio consultație programată</span>
      </div>
    );
  }

  const groups = consultations.reduce((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {});

  const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="prof-list">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="prof-list__group">
          <div className="prof-list__date-header">{formatDate(dateKey)}</div>
          {groups[dateKey].map((c) => (
            <ConsultationRow key={c.id} consultation={c} onEdit={onEdit} onCancel={onCancel} onComplete={onComplete} onDelete={onDelete} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ConsultationList;
