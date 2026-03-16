import { useRef, useEffect } from "react";
import { formatDate, formatTime } from "../../../utils/formatDate";
import "./ConsultationDetailsModal.css";

const ConsultationDetailsModal = ({ consultation: c, onClose, user }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="consultation-modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="consultation-modal__header">
          <span className={`type-badge type-badge--${c.type}`}>
            {c.type === "online" ? "Online" : "Fizic"}
          </span>
          {c.status === "cancelled" && (
            <span className="status-badge status-badge--cancelled">Anulat</span>
          )}
          {c.status === "completed" && (
            <span className="status-badge status-badge--completed">Finalizat</span>
          )}
        </div>

        <h2 className="consultation-modal__course">{c.course?.name}</h2>
        <p className="consultation-modal__professor">
          {c.professor?.firstName} {c.professor?.lastName}
        </p>

        <div className="consultation-modal__details">
          <div className="detail-row">
            <span className="detail-label">Data</span>
            <span className="detail-value">{formatDate(c.date)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Ora</span>
            <span className="detail-value">
              {formatTime(c.time)} · {c.duration} min
            </span>
          </div>
          {c.type === "fizic" && c.room && (
            <div className="detail-row">
              <span className="detail-label">Sala</span>
              <span className="detail-value">{c.room}</span>
            </div>
          )}
          {c.type === "online" && c.meetingLink && (
            <div className="detail-row">
              <span className="detail-label">Link</span>
              <a
                href={c.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="detail-link"
              >
                Intră în sesiune →
              </a>
            </div>
          )}
          {c.materialsLink && (
            <div className="detail-row">
              <span className="detail-label">Materiale</span>
              <a
                href={c.materialsLink}
                target="_blank"
                rel="noreferrer"
                className="detail-link"
              >
                Deschide materiale →
              </a>
            </div>
          )}
          {c.status === "cancelled" && c.cancellationReason && (
            <div className="detail-row">
              <span className="detail-label">Motiv anulare</span>
              <span className="detail-value">{c.cancellationReason}</span>
            </div>
          )}
        </div>

        {c.serie && c.serie !== "Toate" && (
          <p className="consultation-modal__serie">Seria: {c.serie}</p>
        )}
      </div>
    </div>
  );
};

export default ConsultationDetailsModal;
