import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import "./Onboarding.css";

const OnboardingProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    studyYear: "",
    specialization: "",
  });

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const isValid = form.firstName && form.lastName && form.studyYear && form.specialization;

  const handleNext = () => {
    sessionStorage.setItem("onb_profile", JSON.stringify(form));
    navigate("/onboarding/interests");
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-box">
        <div className="onboarding-progress">
          <div className="progress-step done"><div className="progress-circle">✓</div><span className="progress-label">Facultate</span></div>
          <div className="progress-line done" />
          <div className="progress-step active"><div className="progress-circle">2</div><span className="progress-label">Date personale</span></div>
          <div className="progress-line" />
          <div className="progress-step"><div className="progress-circle">3</div><span className="progress-label">Discipline</span></div>
        </div>

        <h2 className="onboarding-step-title">Completează datele tale</h2>
        <p className="onboarding-step-subtitle">Informațiile pot fi modificate ulterior din profil</p>

        <div className="onboarding-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="onb-firstName">Prenume</label>
              <input id="onb-firstName" type="text" value={form.firstName} onChange={set("firstName")} placeholder="ex: Alexandru" />
            </div>
            <div className="form-group">
              <label htmlFor="onb-lastName">Nume</label>
              <input id="onb-lastName" type="text" value={form.lastName} onChange={set("lastName")} placeholder="ex: Popescu" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="onb-email">Email universitar</label>
            <input id="onb-email" type="email" value={user?.email || ""} disabled placeholder="email@stud.ase.ro" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="onb-studyYear">An universitar</label>
              <select id="onb-studyYear" value={form.studyYear} onChange={set("studyYear")}>
                <option value="" disabled>Selectează</option>
                {[1,2,3,4,5].map((y) => (
                  <option key={y} value={y}>Anul {y}{y > 3 ? ` (Master ${y-3})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="onb-specialization">Specializare</label>
              <input id="onb-specialization" type="text" value={form.specialization} onChange={set("specialization")} placeholder="ex: Informatică Economică" />
            </div>
          </div>
        </div>

        <div className="onboarding-actions onboarding-actions--split">
          <button type="button" className="btn-back" onClick={() => navigate("/onboarding")}>
            <i className="fa-solid fa-arrow-left" /> Înapoi
          </button>
          <button type="button" className="btn-confirm" disabled={!isValid} onClick={handleNext}>
            Continuă
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingProfile;
