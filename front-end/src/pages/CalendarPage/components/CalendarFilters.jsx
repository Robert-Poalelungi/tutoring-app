import { useEffect, useState } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import api from "../../../services/axiosInstance";
import FacultySelectModal from "./FacultySelectModal";
import "./CalendarFilters.css";

const STUDY_YEARS = [1, 2, 3];
const CONSULTATION_TYPES = [
  { value: "online", label: "Online" },
  { value: "fizic", label: "Fizic" },
];

const CalendarFilters = () => {
  const { filters, updateFilter, resetFilters } = useCalendar();
  const [faculties, setFaculties] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [showFacultyModal, setShowFacultyModal] = useState(false);

  useEffect(() => {
    api.get("/faculties").then((res) => setFaculties(res.data));
  }, []);

  useEffect(() => {
    if (!filters.facultyId) {
      setSpecializations([]);
      return;
    }
    api
      .get("/specializations", { params: { facultyId: filters.facultyId } })
      .then((res) => setSpecializations(res.data));
  }, [filters.facultyId]);

  const selectedFaculty = faculties.find((f) => f.id === filters.facultyId);

  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  return (
    <>
      <div className="calendar-filters">
        <div className="calendar-filters__group">
          <span className="calendar-filters__label">An:</span>
          {STUDY_YEARS.map((year) => (
            <button
              key={year}
              className={`filter-btn ${filters.studyYear === year ? "filter-btn--active" : ""}`}
              onClick={() =>
                updateFilter("studyYear", filters.studyYear === year ? null : year)
              }
            >
              Anul {year}
            </button>
          ))}
        </div>

        <div className="calendar-filters__group">
          <button
            className={`filter-btn ${filters.facultyId ? "filter-btn--active" : ""}`}
            onClick={() => setShowFacultyModal(true)}
          >
            {selectedFaculty ? selectedFaculty.abbreviation : "Facultate"}
          </button>

          {filters.specializationId || specializations.length > 0 ? (
            <select
              className="filter-select"
              value={filters.specializationId || ""}
              onChange={(e) =>
                updateFilter("specializationId", e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Toate specializările</option>
              {specializations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="calendar-filters__group">
          <span className="calendar-filters__label">Tip:</span>
          {CONSULTATION_TYPES.map((t) => (
            <button
              key={t.value}
              className={`filter-btn ${filters.type === t.value ? "filter-btn--active" : ""}`}
              onClick={() =>
                updateFilter("type", filters.type === t.value ? null : t.value)
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button className="filter-btn filter-btn--reset" onClick={resetFilters}>
            Resetează filtrele
          </button>
        )}
      </div>

      {showFacultyModal && (
        <FacultySelectModal
          faculties={faculties}
          selectedId={filters.facultyId}
          onSelect={(id) => {
            updateFilter("facultyId", id);
            updateFilter("specializationId", null);
            setShowFacultyModal(false);
          }}
          onClose={() => setShowFacultyModal(false)}
        />
      )}
    </>
  );
};

export default CalendarFilters;
