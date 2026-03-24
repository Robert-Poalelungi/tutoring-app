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
import ConsultationDetailsModal from "./components/ConsultationDetailsModal";
import "./CalendarPage.css";

const CalendarPage = () => {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate, filters, session, setSession } = useCalendar();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getActiveSession()
      .then((res) => {
        setSession(res.data);
        if (res.data) {
          const now = new Date();
          const initMonth = res.data.activeSession === "winter"
            ? new Date(now.getFullYear(), 0, 1)
            : new Date(now.getFullYear(), 5, 1);
          setSelectedDate(initMonth);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.studyYear) params.studyYear = filters.studyYear;
    if (filters.facultyId) params.facultyId = filters.facultyId;
    if (filters.specializationId) params.specializationId = filters.specializationId;
    getAllConsultations(params)
      .then((res) => setConsultations(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.studyYear, filters.facultyId, filters.specializationId]);

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const consultationsForDay = consultations.filter((c) => c.date === dateStr);

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
              onSelect={setSelected}
            />
          </div>
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

      {selected && (
        <ConsultationDetailsModal
          consultation={selected}
          user={user}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default CalendarPage;
