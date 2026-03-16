import { useRef } from "react";
import "./FacultySelectModal.css";

const FacultySelectModal = ({ faculties, selectedId, onSelect, onClose }) => {
  const overlayRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="faculty-modal">
        <div className="faculty-modal__header">
          <h3>Selectează facultatea</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="faculty-modal__grid">
          {faculties.map((f) => (
            <button
              key={f.id}
              className={`faculty-card ${selectedId === f.id ? "faculty-card--selected" : ""}`}
              onClick={() => onSelect(f.id)}
            >
              <span className="faculty-card__abbr">{f.abbreviation}</span>
              <span className="faculty-card__name">{f.name}</span>
            </button>
          ))}
        </div>
        <button className="faculty-modal__clear" onClick={() => onSelect(null)}>
          Afișează toate facultățile
        </button>
      </div>
    </div>
  );
};

export default FacultySelectModal;
