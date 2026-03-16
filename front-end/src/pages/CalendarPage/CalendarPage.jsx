import { useState, useEffect } from "react";
import { useCalendar } from "../../context/CalendarContext";
import { useAuth } from "../../context/AuthContext";
import { getAllConsultations } from "../../services/consultationService";
import { getActiveSession } from "../../services/settingsService";
import Navbar from "../../components/shared/Navbar";
import CalendarFilters from "./components/CalendarFilters";
import CalendarGrid from "./components/CalendarGrid";
import DayConsultationsPanel from "./components/DayConsultationsPanel";
import ConsultationLegend from "./components/ConsultationLegend";
import "./CalendarPage.css";

const CalendarPage = () => {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate, filters, session, setSession } = useCalendar();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getActiveSession();
        setSession(res.data);
      } catch (err) {
        console.error("Eroare la încărcarea sesiunii:", err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.studyYear) params.studyYear = filters.studyYear;
        if (filters.specializationId) params.specializationId = filters.specializationId;

        const res = await getAllConsultations(params);
        setConsultations(res.data);
      } catch (err) {
        console.error("Eroare la încărcarea consultațiilor:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, [filters.studyYear, filters.specializationId]);

  const consultationsForDay = consultations.filter(
    (c) => c.date === selectedDate.toISOString().split("T")[0]
  );

  return (
    <div className="calendar-page">
      <Navbar />

      <div className="calendar-page__inner">
        <CalendarFilters />

        <div className="calendar-page__body">
          <DayConsultationsPanel
            date={selectedDate}
            consultations={consultationsForDay}
            loading={loading}
            user={user}
          />

          <div className="calendar-page__right">
            <CalendarGrid
              consultations={consultations}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              session={session}
            />
            <ConsultationLegend />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
