import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, formatTime } from "../../../utils/formatDate";
import { enrollConsultation, unenrollConsultation } from "../../../services/consultationService";
import "./ConsultationDetailsModal.css";

const ConsultationDetailsModal = ({ consultation: c, onClose, user, onRefresh }) => {
  const overlayRef = useRef(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(c.isEnrolled || false);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

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
  const isPast = c.date && new Date(c.date + "T00:00:00") < new Date(new Date().toDateString());

  return createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="consult-modal">
        <div className="consult-modal__header">
          <div>
            <div className="consult-modal__badges">
              <span className={`badge badge--${c.type}`}>{c.type === "online" ? "Online" : "Fizic"}</span>
              {c.status === "cancelled" && <span className="badge badge--cancelled">Anulat</span>}
              {c.status === "completed" && <span className="badge badge--completed">Finalizat</span>}
              {c.status === "published" && !isPast && <span className="badge badge--published">Activ</span>}
            </div>
            <h3 className="consult-modal__title">{courseName}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Închide">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="consult-modal__body">
          <div className="consult-modal__row"><i className="fa-solid fa-user-tie" /><span>{professorName}</span></div>
          <div className="consult-modal__row"><i className="fa-regular fa-calendar" /><span>{formatDate(c.date)}</span></div>
          {c.startTime && (
            <div className="consult-modal__row">
              <i className="fa-regular fa-clock" />
              <span>{formatTime(c.startTime)}{c.endTime ? ` – ${formatTime(c.endTime)}` : ""}{duration ? ` · ${duration}` : ""}</span>
            </div>
          )}
          {c.type === "online" && (c.location || c.meetingLink) && (
            <div className="consult-modal__row">
              <i className="fa-solid fa-video" />
              <a href={c.location || c.meetingLink} target="_blank" rel="noreferrer">Link Zoom</a>
            </div>
          )}
          {c.type === "fizic" && (c.location || c.room) && (
            <div className="consult-modal__row">
              <i className="fa-solid fa-door-open" />
              <span>Sala {c.location || c.room}</span>
            </div>
          )}
          {c.notes && (
            <div className="consult-modal__row">
              <i className="fa-solid fa-note-sticky" />
              <span>{c.notes}</span>
            </div>
          )}
          {c.status === "cancelled" && c.cancellationReason && (
            <div className="consult-modal__row">
              <i className="fa-solid fa-ban" />
              <span>{c.cancellationReason}</span>
            </div>
          )}
        </div>

        <div className="consult-modal__footer">
          {user?.role === "student" && c.status === "published" && !isPast && c.enrollmentSource !== "auto" && (
            !enrolled ? (
              <button type="button" className="modal-btn modal-btn--confirm" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? "Se înscrie..." : "Înscrie-te"}
              </button>
            ) : (
              <button type="button" className="modal-btn modal-btn--cancel" onClick={handleUnenroll} disabled={enrolling}>
                {enrolling ? "..." : "Retrage-te"}
              </button>
            )
          )}
          <button type="button" className="modal-btn modal-btn--confirm" onClick={onClose}>Închide</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConsultationDetailsModal;
