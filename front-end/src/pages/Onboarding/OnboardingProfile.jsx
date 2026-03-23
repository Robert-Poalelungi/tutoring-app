import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axiosInstance";
import "./Onboarding.css";

const detectYearFromEmail = (email) => {
  if (!email) return null;
  // Some university emails embed year info: e.g. firstname.lastname2023@uni.ro
  const match = email.match(/20(\d{2})/);
  if (match) {
    const yr = parseInt("20" + match[1], 10);
    const diff = new Date().getFullYear() - yr + 1;
    if (diff >= 1 && diff <= 3) return String(diff);
  }
  return null;
};

const OnboardingProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const facultyId = sessionStorage.getItem("onboarding_facultyId");

  const [specializations, setSpecializations] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);

  const savedProfile = (() => {
    try { return JSON.parse(sessionStorage.getItem("onboarding_profile") || "{}"); }
    catch { return {}; }
  })();

  const [form, setForm] = useState({
    firstName: savedProfile.firstName || user?.name?.split(" ")[1] || "",
    lastName: savedProfile.lastName || user?.name?.split(" ")[0] || "",
    studyYear: savedProfile.studyYear || detectYearFromEmail(user?.email) || "1",
    serie: savedProfile.serie || "",
    specializationId: savedProfile.specializationId || "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!facultyId) {
      navigate("/onboarding");
      return;
    }
    api.get(`/specializations?facultyId=${facultyId}`)
      .then((res) => setSpecializations(res.data))
      .catch(console.error)
      .finally(() => setLoadingSpecs(false));
  }, [facultyId]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleContinue = (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Te rog completează numele și prenumele.");
      return;
    }
    if (!form.specializationId) {
      setError("Te rog selectează specializarea.");
      return;
    }
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
          Aceste informații ne ajută să-ți afișăm consultațiile potrivite pentru tine.
        </p>

        <form className="onboarding-form" onSubmit={handleContinue}>
          <div className="onboarding-form-row onboarding-form-row--2">
            <div className="onboarding-form-group">
              <label>Prenume</label>
              <input
                type="text"
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="ex: Maria"
                required
                autoFocus
              />
            </div>
            <div className="onboarding-form-group">
              <label>Nume</label>
              <input
                type="text"
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="ex: Ionescu"
                required
              />
            </div>
          </div>

          <div className="onboarding-form-group">
            <label>Email instituțional</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              readOnly
            />
          </div>

          <div className="onboarding-form-row onboarding-form-row--2">
            <div className="onboarding-form-group">
              <label>An de studiu</label>
              <select value={form.studyYear} onChange={set("studyYear")} required>
                {[1, 2, 3].map((y) => (
                  <option key={y} value={y}>Anul {y}</option>
                ))}
              </select>
            </div>
            <div className="onboarding-form-group">
              <label>Seria <span style={{ fontWeight: 400, textTransform: "none", fontSize: "10px" }}>(opțional)</span></label>
              <input
                type="text"
                value={form.serie}
                onChange={set("serie")}
                placeholder="ex: A, B, C..."
                maxLength={5}
              />
            </div>
          </div>

          <div className="onboarding-form-group">
            <label>Specializarea</label>
            {loadingSpecs ? (
              <select disabled><option>Se încarcă...</option></select>
            ) : (
              <select value={form.specializationId} onChange={set("specializationId")} required>
                <option value="">Selectează specializarea</option>
                {specializations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.abbreviation})</option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="onboarding-error">{error}</p>}

          <div className="onboarding-card__actions">
            <button
              type="button"
              className="onboarding-btn onboarding-btn--secondary"
              onClick={() => navigate("/onboarding")}
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
