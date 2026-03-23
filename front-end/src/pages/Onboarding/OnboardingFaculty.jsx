import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axiosInstance";
import "./Onboarding.css";
import "./OnboardingFaculty.css";

const OnboardingFaculty = () => {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/faculties")
      .then((res) => setFaculties(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Pre-select from sessionStorage if navigating back
    const saved = sessionStorage.getItem("onboarding_facultyId");
    if (saved) setSelectedId(Number(saved));
  }, []);

  const handleContinue = () => {
    if (!selectedId) return;
    sessionStorage.setItem("onboarding_facultyId", String(selectedId));
    navigate("/onboarding/profile");
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="progress-dots">
          <div className="progress-dot progress-dot--active" />
          <div className="progress-dot" />
          <div className="progress-dot" />
        </div>

        <p className="onboarding-card__step">Pasul 1 din 3</p>
        <h1 className="onboarding-card__title">Selectează facultatea</h1>
        <p className="onboarding-card__subtitle">
          Alege facultatea la care ești înscris pentru a vedea consultațiile relevante.
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
            Se încarcă facultățile...
          </div>
        ) : (
          <div className="faculty-onboarding-grid">
            {faculties.map((f) => (
              <button
                key={f.id}
                className={`faculty-onboarding-card ${selectedId === f.id ? "faculty-onboarding-card--selected" : ""}`}
                onClick={() => setSelectedId(f.id)}
                type="button"
              >
                <span className="faculty-onboarding-card__abbr">{f.abbreviation}</span>
                <span className="faculty-onboarding-card__name">{f.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="onboarding-card__actions">
          <span />
          <button
            className="onboarding-btn onboarding-btn--primary"
            onClick={handleContinue}
            disabled={!selectedId}
          >
            Continuă →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFaculty;
