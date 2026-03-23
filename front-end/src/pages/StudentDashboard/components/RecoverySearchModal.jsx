import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getAllConsultations, enrollConsultation } from "../../../services/consultationService";
import { formatDate, formatTime } from "../../../utils/formatDate";
import "./RecoverySearchModal.css";

const YEARS = [1, 2, 3];

const RecoverySearchModal = ({ onClose, onEnrolled }) => {
  const overlayRef = useRef(null);
  const [filters, setFilters] = useState({ studyYear: "", search: "" });
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (filters.studyYear) params.studyYear = filters.studyYear;
      const res = await getAllConsultations(params);
      let data = res.data || [];
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        data = data.filter((c) => {
          const courseName = c.course?.name || c.courseName || "";
          const profName = c.professor
            ? `${c.professor.firstName || ""} ${c.professor.lastName || ""}`.trim()
            : c.professorName || "";
          return courseName.toLowerCase().includes(q) || profName.toLowerCase().includes(q);
        });
      }
      // Only show published, not past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      data = data.filter(
        (c) => c.status === "published" && new Date(c.date + "T00:00:00") >= today
      );
      setConsultations(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEnroll = async (c) => {
    setEnrollingId(c.id);
    try {
      await enrollConsultation(c.id);
      setEnrolledIds((prev) => new Set([...prev, c.id]));
      if (onEnrolled) onEnrolled();
    } catch (err) {
      console.error(err);
    }
    setEnrollingId(null);
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="recovery-modal">
        <div className="recovery-modal__header">
          <h2 className="recovery-modal__title">Adaugă consultație pentru recuperare</h2>
          <button className="consult-modal__close" onClick={onClose} aria-label="Închide">✕</button>
        </div>

        <div className="recovery-modal__filters">
          <select
            className="recovery-modal__select"
            value={filters.studyYear}
            onChange={(e) => setFilters((f) => ({ ...f, studyYear: e.target.value }))}
          >
            <option value="">Toate anii</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>Anul {y}</option>
            ))}
          </select>
          <input
            className="recovery-modal__input"
            type="text"
            placeholder="Caută disciplină sau profesor..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
          <button className="btn btn--primary btn--sm" onClick={handleSearch} disabled={loading}>
            {loading ? "Se caută..." : "Caută"}
          </button>
        </div>

        <div className="recovery-modal__results">
          {!searched && (
            <p className="recovery-modal__hint">Selectează un an și/sau scrie o disciplină, apoi apasă Caută.</p>
          )}
          {searched && !loading && consultations.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__icon">🔍</span>
              <span className="empty-state__title">Nicio consultație găsită</span>
              <span>Încearcă alt an sau alt termen de căutare.</span>
            </div>
          )}
          {consultations.map((c) => {
            const courseName = c.course?.name || c.courseName || "—";
            const profName = c.professor
              ? `${c.professor.firstName || ""} ${c.professor.lastName || ""}`.trim()
              : c.professorName || "";
            const alreadyEnrolled = c.isEnrolled || enrolledIds.has(c.id);
            return (
              <div key={c.id} className="recovery-result-row">
                <div className="recovery-result-row__info">
                  <div className="recovery-result-row__course">{courseName}</div>
                  {profName && <div className="recovery-result-row__prof">{profName}</div>}
                  <div className="recovery-result-row__meta">
                    <span className={`badge badge--${c.type}`}>{c.type === "online" ? "Online" : "Fizic"}</span>
                    <span>{formatDate(c.date)}</span>
                    <span>{formatTime(c.startTime || c.time)}</span>
                    {c.course?.studyYear && <span>Anul {c.course.studyYear}</span>}
                  </div>
                </div>
                <button
                  className={alreadyEnrolled ? "btn btn--ghost btn--sm" : "btn btn--primary btn--sm"}
                  disabled={alreadyEnrolled || enrollingId === c.id}
                  onClick={() => !alreadyEnrolled && handleEnroll(c)}
                >
                  {enrollingId === c.id ? "..." : alreadyEnrolled ? "Înscris ✓" : "Înscrie-te"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecoverySearchModal;
