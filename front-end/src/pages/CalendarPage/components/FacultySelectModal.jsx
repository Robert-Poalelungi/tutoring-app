import { useState, useEffect } from "react";
import Modal from "../../../components/shared/Modal";
import { getPublicFaculties } from "../../../services/userService";
import "../../Onboarding/Onboarding.css";
import "./FacultySelectModal.css";

const FacultySelectModal = ({ isOpen, onClose, onSelect, currentFacultyId }) => {
  const [faculties, setFaculties] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isOpen) getPublicFaculties().then((r) => setFaculties(r.data || [])).catch(() => {});
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selectează facultatea"
      onConfirm={() => { if (selected) { onSelect(selected); onClose(); } }}
      confirmLabel="Selectează"
      confirmDisabled={!selected}
    >
      <div className="faculty-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {faculties.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`faculty-card ${selected?.id === f.id ? "selected" : ""} ${f.id === currentFacultyId ? "current" : ""}`}
            onClick={() => setSelected(f)}
          >
            <div className="faculty-card__abbr">{f.abbreviation || f.name.slice(0, 3)}</div>
            <div className="faculty-card__name">{f.name}</div>
          </button>
        ))}
      </div>
      {selected && (
        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
          Schimbarea facultății va reseta specializarea.
        </p>
      )}
    </Modal>
  );
};

export default FacultySelectModal;
