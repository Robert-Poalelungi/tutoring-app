import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import ConsultationsContainer from "./components/ConsultationsContainer";
import GoogleCalendarButton from "./components/GoogleCalendarButton";
import RecoverySearchModal from "./components/RecoverySearchModal";
import ConsultationDetailsModal from "../CalendarPage/components/ConsultationDetailsModal";
import { getStudentConsultations } from "../../services/consultationService";
import { getCalendarStatus } from "../../services/calendarService";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
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
        <div className="student-dashboard__hero">
          <h1 className="student-dashboard__greeting">Bună, {firstName}! 👋</h1>
          <p className="student-dashboard__subtext">
            {totalUpcoming > 0 ? `Ai ${totalUpcoming} consultație${totalUpcoming > 1 ? "i" : ""} viitoare` : "Nu ai consultații viitoare programate"}
          </p>
        </div>

        {calMessage === "error" && (
          <div className="empty-state" style={{ padding: "14px 20px", color: "#e53e3e" }}>
            Conectarea Google Calendar a eșuat. Încearcă din nou.
          </div>
        )}

        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <>
            <section className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">Consultațiile mele</h2>
                {autoUpcoming.length > 0 && <span className="section-count">{autoUpcoming.length}</span>}
              </div>
              <ConsultationsContainer
                consultations={autoUpcoming}
                onSelect={setSelected}
                emptyTitle="Nicio consultație viitoare"
                emptyText="Consultațiile anului și specializării tale apar aici automat."
              />
              {autoPast.length > 0 && (
                <details className="past-toggle">
                  <summary>Consultații trecute ({autoPast.length})</summary>
                  <ConsultationsContainer consultations={autoPast} onSelect={setSelected} isPast />
                </details>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">Recuperări / Restanțe</h2>
                {manualUpcoming.length > 0 && <span className="section-count">{manualUpcoming.length}</span>}
                <button type="button" className="section-action" onClick={() => setShowRecovery(true)}>
                  + Adaugă consultație
                </button>
              </div>
              <ConsultationsContainer
                consultations={manualUpcoming}
                onSelect={setSelected}
                emptyIcon="📚"
                emptyTitle="Nicio consultație adăugată"
                emptyText="Adaugă consultații din alți ani pentru recuperări sau restanțe."
              />
              {manualPast.length > 0 && (
                <details className="past-toggle">
                  <summary>Trecute ({manualPast.length})</summary>
                  <ConsultationsContainer consultations={manualPast} onSelect={setSelected} isPast />
                </details>
              )}
            </section>

            <GoogleCalendarButton status={calStatus} onStatusChange={setCalStatus} />
          </>
        )}

        {selected && <ConsultationDetailsModal consultation={selected} user={user} onClose={() => setSelected(null)} onRefresh={load} />}
        {showRecovery && <RecoverySearchModal user={user} onClose={() => setShowRecovery(false)} onEnrolled={load} />}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
