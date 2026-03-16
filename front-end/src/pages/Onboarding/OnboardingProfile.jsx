import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axiosInstance";
import "./Onboarding.css";

const OnboardingProfile = () => {
  const navigate = useNavigate();
  const facultyId = sessionStorage.getItem("onboarding_facultyId");
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState({
    name: "",
    studyYear: "1",
    serie: "Toate",
    specializationId: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!facultyId) { navigate("/onboarding/faculty"); return; }
    api.get(`/specializations?facultyId=${facultyId}`)
      .then((res) => setSpecializations(res.data))
      .catch(console.error);
  }, [facultyId]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleContinue = (e) => {
    e.preventDefault();
    sessionStorage.setItem("onboarding_profile", JSON.stringify({ ...form, facultyId }));
    navigate("/onboarding/interests");
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="progress-dots">
          <div className="progress-dot progress-dot--done" />
          <div className="progress-dot progress-dot--active" />
          <div className="progress-dot" />
        </div>
        <p className="onboarding-card__step">Pasul 2 din 3</p>
        <h1 className="onboarding-card__title">Completează profilul</h1>
        <p className="onboarding-card__subtitle">
          Aceste informații ne ajută să-ți afișăm consultațiile potrivite.
        </p>

        <form onSubmit={handleContinue} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="onboarding-form-group">
            <label>Nume complet</label>
            <input type="text" value={form.name} onChange={set("name")} required placeholder="ex: Ionescu Maria" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="onboarding-form-group">
              <label>An de studiu</label>
              <select value={form.studyYear} onChange={set("studyYear")} required>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>Anul {y}</option>
                ))}
              </select>
            </div>
            <div className="onboarding-form-group">
              <label>Seria</label>
              <input type="text" value={form.serie} onChange={set("serie")} placeholder="ex: A sau Toate" />
            </div>
          </div>
          <div className="onboarding-form-group">
            <label>Specializare</label>
            <select value={form.specializationId} onChange={set("specializationId")} required>
              <option value="">Selectează specializarea</option>
              {specializations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="onboarding-card__actions">
            <button
              type="button"
              className="onboarding-btn onboarding-btn--secondary"
              onClick={() => navigate("/onboarding/faculty")}
            >
              ← Înapoi
            </button>
            <button type="submit" className="onboarding-btn onboarding-btn--primary">
              Continuă →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingProfile;
