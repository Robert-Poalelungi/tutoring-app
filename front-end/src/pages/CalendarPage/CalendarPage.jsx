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
        // Initialize calendar to first session month
        if (res.data) {
          const now = new Date();
          let initMonth;
          if (res.data.activeSession === "winter") {
            initMonth = new Date(now.getFullYear(), 0, 1); // January
          } else {
            initMonth = new Date(now.getFullYear(), 5, 1); // June
          }
          setSelectedDate(initMonth);
        }
      } catch (err) {
        console.error("Session load error:", err);
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
        if (filters.facultyId) params.facultyId = filters.facultyId;
        const res = await getAllConsultations(params);
        setConsultations(res.data);
      } catch (err) {
        console.error("Consultations load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, [filters.studyYear, filters.specializationId, filters.facultyId]);

  // Client-side filtering for type
  const filteredConsultations = consultations.filter((c) => {
    if (filters.type && c.type !== filters.type) return false;
    return true;
  });

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const consultationsForDay = filteredConsultations.filter((c) => c.date === dateStr);

  return (
    <div className="calendar-page">
      <Navbar />
      <div className="calendar-page__inner">
        <CalendarFilters />
        <div className="calendar-page__body">
          <div className="calendar-page__left">
            <DayConsultationsPanel
              date={selectedDate}
              consultations={consultationsForDay}
              loading={loading}
              user={user}
            />
          </div>
          <div className="calendar-page__right">
            <CalendarGrid
              consultations={filteredConsultations}
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
