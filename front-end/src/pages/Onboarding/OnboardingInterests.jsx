import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { completeProfile } from "../../services/userService";
import "./Onboarding.css";

const OnboardingInterests = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFinish = async () => {
    const profileRaw = sessionStorage.getItem("onboarding_profile");
    if (!profileRaw) { navigate("/onboarding/faculty"); return; }
    const profile = JSON.parse(profileRaw);
    setLoading(true);
    try {
      await completeProfile({
        name: profile.name,
        studyYear: Number(profile.studyYear),
        serie: profile.serie,
        facultyId: Number(profile.facultyId),
        specializationId: Number(profile.specializationId),
      });
      sessionStorage.removeItem("onboarding_facultyId");
      sessionStorage.removeItem("onboarding_profile");
      await fetchUser();
      navigate("/dashboard");
    } catch (err) {
      setError("A apărut o eroare. Încearcă din nou.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card" style={{ textAlign: "center" }}>
        <div className="progress-dots" style={{ justifyContent: "center" }}>
          <div className="progress-dot progress-dot--done" />
          <div className="progress-dot progress-dot--done" />
          <div className="progress-dot progress-dot--active" />
        </div>
        <p className="onboarding-card__step">Pasul 3 din 3</p>
        <div style={{ fontSize: "48px", margin: "16px 0" }}>🎓</div>
        <h1 className="onboarding-card__title">Totul este gata!</h1>
        <p className="onboarding-card__subtitle">
          Profilul tău a fost configurat. Acum poți accesa consultațiile și calendarul personalizat.
        </p>
        {error && (
          <p style={{ color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
        )}
        <div className="onboarding-card__actions" style={{ justifyContent: "center" }}>
          <button
            className="onboarding-btn onboarding-btn--primary"
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? "Se salvează..." : "Accesează aplicația →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingInterests;
