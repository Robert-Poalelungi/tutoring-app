import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import ConsultationsContainer from "./components/ConsultationsContainer";
import ConsultationDetailsModal from "../CalendarPage/components/ConsultationDetailsModal";
import GoogleCalendarButton from "./components/GoogleCalendarButton";
import { getStudentConsultations } from "../../services/consultationService";
import { getCalendarStatus, syncCalendar, disconnectCalendar } from "../../services/calendarService";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [consultRes, calRes] = await Promise.all([
          getStudentConsultations(),
          getCalendarStatus(),
        ]);
        setConsultations(consultRes.data);
        setCalendarConnected(calRes.data.connected);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = consultations.filter(
    (c) => c.status === "published" && new Date(c.date) >= today
  );
  const past = consultations.filter(
    (c) =>
      c.status === "completed" ||
      c.status === "cancelled" ||
      new Date(c.date) < today
  );

  const handleSync = async () => {
    try {
      await syncCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectCalendar();
      setCalendarConnected(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="student-dashboard">
          <p>Se încarcă...</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="student-dashboard">
        <div className="student-dashboard__header">
          <div>
            <h1 className="student-dashboard__greeting">
              Bună, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="student-dashboard__subtext">
              Consultațiile tale înscrise
            </p>
          </div>
          <GoogleCalendarButton
            connected={calendarConnected}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
          />
        </div>

        <div className="student-dashboard__section">
          <h2 className="student-dashboard__section-title">
            Consultații viitoare
          </h2>
          <ConsultationsContainer
            consultations={upcoming}
            onSelect={setSelectedConsultation}
            emptyMessage="Nu ești înscris la nicio consultație viitoare."
          />
        </div>

        <div className="student-dashboard__section">
          <h2 className="student-dashboard__section-title">
            Consultații trecute
          </h2>
          <ConsultationsContainer
            consultations={past}
            onSelect={setSelectedConsultation}
            emptyMessage="Nu ai consultații trecute."
          />
        </div>

        {selectedConsultation && (
          <ConsultationDetailsModal
            consultation={selectedConsultation}
            onClose={() => setSelectedConsultation(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
