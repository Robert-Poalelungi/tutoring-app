import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { getPublicFaculties, getPublicSpecializations } from "../../../services/userService";
import "./CalendarFilters.css";

const YEARS = [1, 2, 3];

const CalendarFilters = () => {
  const { filters, updateFilter, resetFilters } = useCalendar();
  const [faculties, setFaculties] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    getPublicFaculties().then((r) => setFaculties(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.facultyId) { setSpecializations([]); return; }
    getPublicSpecializations(filters.facultyId)
      .then((r) => setSpecializations(r.data || []))
      .catch(() => {});
  }, [filters.facultyId]);

  return (
    <div className="calendar-filters" aria-label="Filtre calendar">
      <div className="cal-filter-group">
        <label>An</label>
        <div className="cal-year-buttons">
          {YEARS.map((y) => (
            <button
              key={y}
              type="button"
              className={`cal-year-btn ${filters.studyYear === y ? "active" : ""}`}
              onClick={() => updateFilter("studyYear", filters.studyYear === y ? null : y)}
            >
              Anul {y}
            </button>
          ))}
        </div>
      </div>

      <div className="cal-filter-group">
        <label htmlFor="faculty-filter">Facultate</label>
        <select
          id="faculty-filter"
          className="cal-filter-select"
          value={filters.facultyId || ""}
          onChange={(e) => {
            updateFilter("facultyId", e.target.value || null);
            updateFilter("specializationId", null);
          }}
        >
          <option value="">Toate facultățile</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.abbreviation || f.name}</option>
          ))}
        </select>
      </div>

      {specializations.length > 0 && (
        <div className="cal-filter-group">
          <label htmlFor="spec-filter">Specializare</label>
          <select
            id="spec-filter"
            className="cal-filter-select"
            value={filters.specializationId || ""}
            onChange={(e) => updateFilter("specializationId", e.target.value || null)}
          >
            <option value="">Toate</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {(filters.studyYear || filters.facultyId) && (
        <button type="button" className="cal-filter-reset" onClick={resetFilters}>
          <i className="fa-solid fa-xmark" /> Resetează
        </button>
      )}
    </div>
  );
};

export default CalendarFilters;
