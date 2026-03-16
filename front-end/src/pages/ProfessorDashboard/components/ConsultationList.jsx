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

const ConsultationList = ({ consultations, onEdit, onCancel, onComplete, onDelete }) => {
  if (!consultations || consultations.length === 0) {
    return (
      <div className="consultation-list__empty">
        Nu ai nicio consultație programată încă.
      </div>
    );
  }

  // Group consultations by date
  const groups = consultations.reduce((acc, consultation) => {
    const dateKey = consultation.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(consultation);
    return acc;
  }, {});

  // Sort date keys ascending
  const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="consultation-list">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="consultation-group">
          <div className="consultation-group__date">
            {formatDate(dateKey)}
          </div>
          {groups[dateKey].map((c) => (
            <ConsultationRow
              key={c.id}
              consultation={c}
              onEdit={onEdit}
              onCancel={onCancel}
              onComplete={onComplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const ConsultationRow = ({ consultation, onEdit, onCancel, onComplete, onDelete }) => {
  const { id, startTime, endTime, courseName, type, status } = consultation;

  const isActive = status === "published";
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";

  return (
    <div className="consultation-row">
      <span className="consultation-row__time">
        {formatTime(startTime)} – {formatTime(endTime)}
      </span>

      <span className="consultation-row__course">{courseName}</span>

      <div className="consultation-row__badges">
        <span className={`badge badge--${type}`}>
          {TYPE_LABELS[type] ?? type}
        </span>
        <span className={`badge badge--${status}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="consultation-row__actions">
        {isActive && (
          <button
            className="action-btn"
            onClick={() => onEdit(consultation)}
            title="Editează"
          >
            Editează
          </button>
        )}
        {isActive && (
          <button
            className="action-btn action-btn--success"
            onClick={() => onComplete(id)}
            title="Marchează ca finalizată"
          >
            Finalizează
          </button>
        )}
        {isActive && (
          <button
            className="action-btn action-btn--danger"
            onClick={() => onCancel(id)}
            title="Anulează"
          >
            Anulează
          </button>
        )}
        {(isCancelled || isCompleted) && (
          <button
            className="action-btn action-btn--danger"
            onClick={() => onDelete(id)}
            title="Șterge definitiv"
          >
            Șterge
          </button>
        )}
      </div>
    </div>
  );
};

export default ConsultationList;
