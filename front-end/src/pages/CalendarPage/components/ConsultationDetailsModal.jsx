import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, formatTime } from "../../../utils/formatDate";
import { enrollConsultation, unenrollConsultation } from "../../../services/consultationService";
import "./ConsultationDetailsModal.css";

const ConsultationDetailsModal = ({ consultation: c, onClose, user, onRefresh }) => {
  const overlayRef = useRef(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(c.isEnrolled || false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollConsultation(c.id);
      setEnrolled(true);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    setEnrolling(true);
    try {
      await unenrollConsultation(c.id);
      setEnrolled(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const duration = (() => {
    if (!c.startTime || !c.endTime) return c.duration ? `${c.duration} min` : "";
    const [sh, sm] = c.startTime.split(":").map(Number);
    const [eh, em] = c.endTime.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return `${mins} min`;
  })();

  const professorName = c.professor
    ? `${c.professor.firstName || ""} ${c.professor.lastName || ""}`.trim()
    : c.professorName || "";

  const courseName = c.course?.name || c.courseName || "";

  return createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="consult-modal">
        {/* Header */}
        <div className="consult-modal__header">
          <div className="consult-modal__badges">
            <span className={`badge badge--${c.type}`}>
              {c.type === "online" ? "Online" : "Fizic"}
            </span>
            {c.status === "cancelled" && <span className="badge badge--cancelled">Anulat</span>}
            {c.status === "completed" && <span className="badge badge--completed">Finalizat</span>}
            {c.status === "published" && <span className="badge badge--published">Activ</span>}
          </div>
          <button className="consult-modal__close" onClick={onClose} aria-label="Închide">✕</button>
        </div>

        {/* Title */}
        <div className="consult-modal__title-block">
          <h2 className="consult-modal__course">{courseName}</h2>
          <p className="consult-modal__professor">{professorName}</p>
        </div>

        {/* Details */}
        <div className="consult-modal__details">
          <div className="detail-row">
            <span className="detail-label">Data</span>
            <span className="detail-value">{formatDate(c.date)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Ora</span>
            <span className="detail-value">
              {formatTime(c.startTime || c.time)}
              {c.endTime ? ` – ${formatTime(c.endTime)}` : ""}
              {duration ? ` · ${duration}` : ""}
            </span>
          </div>
          {c.type === "fizic" && (c.location || c.room) && (
            <div className="detail-row">
              <span className="detail-label">Sala</span>
              <span className="detail-value">{c.location || c.room}</span>
            </div>
          )}
          {c.type === "online" && (c.location || c.meetingLink) && (
            <div className="detail-row">
              <span className="detail-label">Link</span>
              <a href={c.location || c.meetingLink} target="_blank" rel="noreferrer" className="detail-link">
                Intră în sesiune →
              </a>
            </div>
          )}
          {c.materialsLink && (
            <div className="detail-row">
              <span className="detail-label">Materiale</span>
              <a href={c.materialsLink} target="_blank" rel="noreferrer" className="detail-link">
                Deschide →
              </a>
            </div>
          )}
          {c.maxParticipants && (
            <div className="detail-row">
              <span className="detail-label">Locuri</span>
              <span className="detail-value">{c.maxParticipants} max</span>
            </div>
          )}
          {c.serie && c.serie !== "Toate" && (
            <div className="detail-row">
              <span className="detail-label">Seria</span>
              <span className="detail-value">{c.serie}</span>
            </div>
          )}
          {c.notes && (
            <div className="detail-row detail-row--notes">
              <span className="detail-label">Notițe</span>
              <span className="detail-value">{c.notes}</span>
            </div>
          )}
          {c.status === "cancelled" && c.cancellationReason && (
            <div className="detail-row detail-row--danger">
              <span className="detail-label">Motiv</span>
              <span className="detail-value">{c.cancellationReason}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {user?.role === "student" && c.status === "published" && (
          <div className="consult-modal__actions">
            {c.enrollmentSource === "auto" ? null : !enrolled ? (
              <button
                className="btn btn--primary"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? "Se înscrie..." : "Înscrie-te"}
              </button>
            ) : (
              <button
                className="btn btn--secondary"
                onClick={handleUnenroll}
                disabled={enrolling}
              >
                {enrolling ? "..." : "Retrage-te"}
              </button>
            )}
            {c.type === "online" && (c.location || c.meetingLink) && (
              <a
                href={c.location || c.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn--ghost"
              >
                Intră online →
              </a>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ConsultationDetailsModal;
