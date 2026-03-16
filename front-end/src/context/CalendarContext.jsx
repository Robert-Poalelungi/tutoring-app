import { createContext, useContext, useState } from "react";

const CalendarContext = createContext(null);

export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({
    studyYear: null,
    type: null,
    facultyId: null,
    specializationId: null,
    professorId: null,
    courseId: null,
  });
  const [session, setSession] = useState(null);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      studyYear: null,
      type: null,
      facultyId: null,
      specializationId: null,
      professorId: null,
      courseId: null,
    });
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        filters,
        updateFilter,
        resetFilters,
        session,
        setSession,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
