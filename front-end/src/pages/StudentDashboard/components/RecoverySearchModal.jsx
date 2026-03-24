import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getAllConsultations, enrollConsultation, unenrollConsultation } from "../../../services/consultationService";
import { getPublicSpecializations } from "../../../services/userService";
import { formatDate, formatTime } from "../../../utils/formatDate";
import "../../../components/shared/Modal.css";
import "./RecoverySearchModal.css";

const YEARS = [1, 2, 3];

const RecoverySearchModal = ({ user, onClose, onEnrolled }) => {
  const overlayRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const [filters, setFilters] = useState({ studyYear: "", specializationId: "" });
  const [specializations, setSpecializations] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState(new Set());

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const facultyId = user?.facultyId || user?.faculty?.id;
    if (facultyId) getPublicSpecializations(facultyId).then((r) => setSpecializations(r.data || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.studyYear) params.studyYear = filters.studyYear;
    if (filters.specializationId) params.specializationId = filters.specializationId;
    getAllConsultations(params)
      .then((r) => {
        const today = new Date(); today.setHours(0,0,0,0);
        setConsultations((r.data || []).filter((c) =>
          c.status === "published" && new Date(c.date + "T00:00:00") >= today
        ));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.studyYear, filters.specializationId]);

  const handleEnroll = async (c) => {
    setEnrollingId(c.id);
    try {
      await enrollConsultation(c.id);
      setEnrolledIds((s) => new Set([...s, c.id]));
      if (onEnrolled) onEnrolled();
    } catch (err) { console.error(err); }
    finally { setEnrollingId(null); }
  };

  const handleUnenroll = async (c) => {
    setEnrollingId(c.id);
    try {
      await unenrollConsultation(c.id);
      setEnrolledIds((s) => { const n = new Set(s); n.delete(c.id); return n; });
      if (onEnrolled) onEnrolled();
    } catch (err) { console.error(err); }
    finally { setEnrollingId(null); }
  };

  return createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="recovery-modal">
        <div className="modal-header">
          <h3 className="modal-title">Adaugă consultații</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Închide">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="recovery-modal__filters">
          <select
            className="recovery-modal__select"
            value={filters.studyYear}
            onChange={(e) => setFilters((f) => ({ ...f, studyYear: e.target.value }))}
          >
            <option value="">Toate anii</option>
            {YEARS.map((y) => <option key={y} value={y}>Anul {y}</option>)}
          </select>
          <select
            className="recovery-modal__select"
            value={filters.specializationId}
            onChange={(e) => setFilters((f) => ({ ...f, specializationId: e.target.value }))}
          >
            <option value="">Toate specializările</option>
            {specializations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="recovery-modal__body">
          {loading ? <div className="loading-spinner" /> : consultations.length === 0 ? (
            <div className="empty-state"><span className="empty-state__icon">📚</span><span>Nicio consultație găsită</span></div>
          ) : (
            consultations.map((c) => {
              const enrolled = enrolledIds.has(c.id) || c.isEnrolled;
              return (
                <div key={c.id} className="recovery-modal__card">
                  <div className="recovery-modal__card-info">
                    <div className="recovery-modal__course">{c.course?.name || c.courseName}</div>
                    <div className="recovery-modal__meta">
                      {c.professor ? `${c.professor.firstName} ${c.professor.lastName}` : c.professorName}
                      {" · "}{formatDate(c.date)}
                      {c.startTime ? ` · ${formatTime(c.startTime)}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`recovery-modal__enroll-btn ${enrolled ? "recovery-modal__enroll-btn--enrolled" : ""}`}
                    onClick={() => enrolled ? handleUnenroll(c) : handleEnroll(c)}
                    disabled={enrollingId === c.id}
                  >
                    {enrolled ? "Retrage-te" : "Înscrie-te"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecoverySearchModal;
