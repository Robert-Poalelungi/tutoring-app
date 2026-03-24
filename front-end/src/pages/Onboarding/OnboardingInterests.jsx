import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { completeProfile } from "../../services/userService";
import "./Onboarding.css";

const OnboardingInterests = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Courses endpoint not available yet; grid shows when data is loaded
  }, []);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const handleFinish = async (skip = false) => {
    setSaving(true);
    try {
      const profile = JSON.parse(sessionStorage.getItem("onb_profile") || "{}");
      const faculty = JSON.parse(sessionStorage.getItem("onb_faculty") || "{}");
      await completeProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        studyYear: Number(profile.studyYear),
        specialization: profile.specialization,
        facultyId: faculty.id,
        interests: skip ? [] : selected,
      });
      sessionStorage.removeItem("onb_faculty");
      sessionStorage.removeItem("onb_profile");
      await fetchUser();
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-box">
        <div className="onboarding-progress">
          <div className="progress-step done"><div className="progress-circle">✓</div><span className="progress-label">Facultate</span></div>
          <div className="progress-line done" />
          <div className="progress-step done"><div className="progress-circle">✓</div><span className="progress-label">Date personale</span></div>
          <div className="progress-line done" />
          <div className="progress-step active"><div className="progress-circle">3</div><span className="progress-label">Discipline</span></div>
        </div>

        <h2 className="onboarding-step-title">Adaugă discipline suplimentare</h2>
        <p className="onboarding-step-subtitle">Opțional — discipline la care dorești consultații (restanțe, reexaminări)</p>

        {courses.length > 0 && (
          <div className="disciplines-grid">
            {courses.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`discipline-card ${selected.includes(c.id) ? "selected" : ""}`}
                onClick={() => toggle(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="onboarding-actions onboarding-actions--split">
          <button type="button" className="btn-back" onClick={() => navigate("/onboarding/profile")}>
            <i className="fa-solid fa-arrow-left" /> Înapoi
          </button>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="button" className="btn-skip" onClick={() => handleFinish(true)} disabled={saving}>
              Skip
            </button>
            <button type="button" className="btn-confirm" onClick={() => handleFinish(false)} disabled={saving}>
              {saving ? "Se salvează..." : "Finalizează"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingInterests;
