import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicFaculties } from "../../services/userService";
import "./Onboarding.css";
import "./OnboardingFaculty.css";

const OnboardingFaculty = () => {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getPublicFaculties().then((r) => setFaculties(r.data)).catch(console.error);
  }, []);

  const handleNext = () => {
    sessionStorage.setItem("onb_faculty", JSON.stringify(selected));
    navigate("/onboarding/profile");
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-box">
        {/* Progress */}
        <div className="onboarding-progress">
          <div className="progress-step active"><div className="progress-circle">1</div><span className="progress-label">Facultate</span></div>
          <div className="progress-line" />
          <div className="progress-step"><div className="progress-circle">2</div><span className="progress-label">Date personale</span></div>
          <div className="progress-line" />
          <div className="progress-step"><div className="progress-circle">3</div><span className="progress-label">Discipline</span></div>
        </div>

        <h2 className="onboarding-step-title">Alege facultatea ta</h2>
        <p className="onboarding-step-subtitle">Selectează facultatea la care ești înscris</p>

        <div className="faculty-grid">
          {faculties.map((f) => (
            <button
              type="button"
              key={f.id}
              className={`faculty-card ${selected?.id === f.id ? "selected" : ""}`}
              onClick={() => setSelected(f)}
            >
              <div className="faculty-card__abbr">{f.abbreviation || f.name.slice(0, 3)}</div>
              <div className="faculty-card__name">{f.name}</div>
            </button>
          ))}
        </div>

        <div className="onboarding-actions">
          <button type="button" className="btn-confirm" disabled={!selected} onClick={handleNext}>
            Continuă
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFaculty;
