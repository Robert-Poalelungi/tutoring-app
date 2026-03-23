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
    if (!profileRaw) { navigate("/onboarding"); return; }

    let profile;
    try { profile = JSON.parse(profileRaw); }
    catch { navigate("/onboarding"); return; }

    setLoading(true);
    setError(null);

    try {
      await completeProfile({
        name: `${profile.lastName} ${profile.firstName}`,
        studyYear: Number(profile.studyYear),
        serie: profile.serie || null,
        facultyId: Number(profile.facultyId),
        specializationId: Number(profile.specializationId),
      });
      sessionStorage.removeItem("onboarding_facultyId");
      sessionStorage.removeItem("onboarding_profile");
      await fetchUser();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("A apărut o eroare la salvarea profilului. Încearcă din nou.");
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

        <div style={{ fontSize: "52px", margin: "12px 0 20px", display: "block" }}>🎓</div>

        <h1 className="onboarding-card__title">Totul este gata!</h1>
        <p className="onboarding-card__subtitle">
          Profilul tău a fost configurat. Vei vedea automat consultațiile
          relevante pentru specializarea și anul tău de studiu.
        </p>

        <div style={{ background: "var(--primary-muted)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "8px" }}>
          <p style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, lineHeight: 1.6 }}>
            ✓ Consultațiile tale vor apărea în Dashboard<br />
            ✓ Primești notificări cu 24h și 1h înainte<br />
            ✓ Poți conecta Google Calendar oricând din Profil
          </p>
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <div className="onboarding-card__actions" style={{ justifyContent: "center" }}>
          <button
            className="onboarding-btn onboarding-btn--secondary"
            onClick={() => navigate("/onboarding/profile")}
            disabled={loading}
          >
            ← Înapoi
          </button>
          <button
            className="onboarding-btn onboarding-btn--primary"
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? "Se salvează..." : "Intră în aplicație →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingInterests;
