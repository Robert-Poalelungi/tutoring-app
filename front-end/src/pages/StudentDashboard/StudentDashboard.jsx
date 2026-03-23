import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import ConsultationCard from "./components/ConsultationCard";
import RecoverySearchModal from "./components/RecoverySearchModal";
import ConsultationDetailsModal from "../CalendarPage/components/ConsultationDetailsModal";
import { getStudentConsultations } from "../../services/consultationService";
import { getCalendarStatus } from "../../services/calendarService";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [autoConsultations, setAutoConsultations] = useState([]);
  const [manualConsultations, setManualConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [calStatus, setCalStatus] = useState({ connected: false, email: null });
  const [calMessage, setCalMessage] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const didCheckParams = useRef(false);

  const load = async () => {
    try {
      const cRes = await getStudentConsultations();
      const raw = cRes.data;
      if (Array.isArray(raw)) {
        setAutoConsultations(raw);
        setManualConsultations([]);
      } else {
        setAutoConsultations(raw?.auto ?? []);
        setManualConsultations(raw?.manual ?? []);
      }
    } catch (err) {
      console.error("Consultations error:", err);
    }
    try {
      const calRes = await getCalendarStatus();
      setCalStatus(calRes.data ?? { connected: false });
    } catch {
      // calendar service optional – keep defaults
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!didCheckParams.current) {
      didCheckParams.current = true;
      const params = new URLSearchParams(window.location.search);
      const cal = params.get("calendar");
      if (cal === "connected") setCalMessage("connected");
      if (cal === "error") setCalMessage("error");
      if (cal) window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isUpcoming = (c) => c.status === "published" && new Date(c.date + "T00:00:00") >= today;
  const isPastC = (c) => c.status === "completed" || c.status === "cancelled" || new Date(c.date + "T00:00:00") < today;

  const autoUpcoming = autoConsultations.filter(isUpcoming);
  const autoPast = autoConsultations.filter(isPastC);
  const manualUpcoming = manualConsultations.filter(isUpcoming);
  const manualPast = manualConsultations.filter(isPastC);

  const totalUpcoming = autoUpcoming.length + manualUpcoming.length;

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        {/* Header */}
        <div className="student-dashboard__hero">
          <div>
            <h1 className="student-dashboard__greeting">Bună, {firstName}! 👋</h1>
            <p className="student-dashboard__subtext">
              {totalUpcoming > 0
                ? `Ai ${totalUpcoming} consultație${totalUpcoming > 1 ? "i" : ""} viitoare`
                : "Nu ai consultații viitoare programate"}
            </p>
          </div>
        </div>

        {calMessage === "error" && (
          <div className="empty-state" style={{ padding: "14px 20px", borderColor: "var(--danger)", background: "var(--danger-light)", color: "var(--danger)" }}>
            Conectarea Google Calendar a eșuat. Încearcă din nou.
          </div>
        )}

        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <>
            {/* Auto — consultații din anul și specializarea mea */}
            <section className="student-dashboard__section">
              <div className="section-header">
                <h2 className="section-title">Consultațiile mele</h2>
                <span className="section-count">{autoUpcoming.length}</span>
              </div>
              {autoUpcoming.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">🗓️</span>
                  <span className="empty-state__title">Nicio consultație viitoare</span>
                  <span>Consultațiile anului și specializării tale apar aici automat.</span>
                </div>
              ) : (
                <div className="consultations-grid">
                  {autoUpcoming.map((c) => (
                    <ConsultationCard key={c.id} consultation={c} onClick={() => setSelected(c)} />
                  ))}
                </div>
              )}
              {autoPast.length > 0 && (
                <details className="student-dashboard__past-toggle">
                  <summary>Consultații trecute ({autoPast.length})</summary>
                  <div className="consultations-grid" style={{ marginTop: 12 }}>
                    {autoPast.map((c) => (
                      <ConsultationCard key={c.id} consultation={c} onClick={() => setSelected(c)} isPast />
                    ))}
                  </div>
                </details>
              )}
            </section>

            {/* Recovery — consultații adăugate manual pentru recuperări */}
            <section className="student-dashboard__section">
              <div className="section-header">
                <h2 className="section-title">Recuperări / Restanțe</h2>
                {manualUpcoming.length > 0 && (
                  <span className="section-count">{manualUpcoming.length}</span>
                )}
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setShowRecovery(true)}
                >
                  + Adaugă consultație
                </button>
              </div>
              {manualUpcoming.length === 0 && manualPast.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">📚</span>
                  <span className="empty-state__title">Nicio consultație adăugată</span>
                  <span>Adaugă consultații din alți ani pentru recuperări sau restanțe.</span>
                </div>
              ) : (
                <>
                  {manualUpcoming.length > 0 && (
                    <div className="consultations-grid">
                      {manualUpcoming.map((c) => (
                        <ConsultationCard key={c.id} consultation={c} onClick={() => setSelected(c)} />
                      ))}
                    </div>
                  )}
                  {manualPast.length > 0 && (
                    <details className="student-dashboard__past-toggle">
                      <summary>Trecute ({manualPast.length})</summary>
                      <div className="consultations-grid" style={{ marginTop: 12 }}>
                        {manualPast.map((c) => (
                          <ConsultationCard key={c.id} consultation={c} onClick={() => setSelected(c)} isPast />
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </section>

            {/* Google Calendar — bottom, simplified */}
            <div className="gcal-card card">
              <div className="gcal-card__info">
                <span className="gcal-card__label">Google Calendar</span>
                {calStatus.connected ? (
                  <>
                    <span className="badge badge--completed">Sincronizat ✓</span>
                    {(calStatus.googleEmail || calStatus.email) && (
                      <span className="gcal-card__email">{calStatus.googleEmail || calStatus.email}</span>
                    )}
                  </>
                ) : (
                  <span className="badge badge--draft">Neconectat</span>
                )}
              </div>
              <div className="gcal-card__actions">
                {!calStatus.connected && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => { window.location.href = "/api/google-calendar/connect"; }}
                  >
                    Conectează Calendar
                  </button>
                )}
                {calStatus.connected && (
                  <button className="btn btn--ghost btn--sm" onClick={() => navigate("/profile")}>
                    Gestionează →
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {selected && (
          <ConsultationDetailsModal
            consultation={selected}
            user={user}
            onClose={() => setSelected(null)}
            onRefresh={load}
          />
        )}

        {showRecovery && (
          <RecoverySearchModal
            onClose={() => setShowRecovery(false)}
            onEnrolled={() => { load(); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
