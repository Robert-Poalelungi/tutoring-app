import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { consultationApi, settingsApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/modal.css';
import '../student/student.css';
import './calendar.css';

const MONTH_NAMES = [
  'Ianuarie',
  'Februarie',
  'Martie',
  'Aprilie',
  'Mai',
  'Iunie',
  'Iulie',
  'August',
  'Septembrie',
  'Octombrie',
  'Noiembrie',
  'Decembrie',
];

const WEEKDAY_NAMES = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];

const formatDateKey = (year, month, day) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const getProfessorName = (consultation) => {
  const first = consultation.professor?.firstName || '';
  const last = consultation.professor?.lastName || '';
  return `${first} ${last}`.trim() || '-';
};

const normalizeExternalUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)) {
    return raw;
  }
  return `https://${raw}`;
};

const getLinkLabel = (url, fallback) => {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
};

const extractDriveFolderId = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    const folderMatch = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) {
      return folderMatch[1];
    }

    return parsed.searchParams.get('id') || '';
  } catch {
    return '';
  }
};

const normalizeConsultation = (consultation) => ({
  id: consultation.id,
  date: consultation.date,
  ora: consultation.time?.slice(0, 5) || '-',
  profesor: getProfessorName(consultation),
  materie: consultation.course?.name || '-',
  tip: consultation.type || 'fizic',
  link: normalizeExternalUrl(consultation.meetingLink),
  sala: consultation.room || '',
  materialeLink: normalizeExternalUrl(consultation.materialsLink),
  materialeFolderId: extractDriveFolderId(consultation.materialsLink),
  an: consultation.course?.studyYear ? String(consultation.course.studyYear) : '-',
  facultate: consultation.course?.faculty?.abbreviation || '-',
  serie: consultation.serie || 'Toate',
  raw: consultation,
});

function Calendar() {
  const [consultations, setConsultations] = useState([]);
  const [sessionMonths, setSessionMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const [detailsConsultation, setDetailsConsultation] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [data, sessionData] = await Promise.all([
          consultationApi.getPublicConsultations(),
          settingsApi.getActiveSession(),
        ]);
        if (!isMounted) return;
        const normalized = Array.isArray(data) ? data.map(normalizeConsultation) : [];
        setConsultations(normalized);
        // months din backend sunt 1-indexed (1=Ian), getMonth() e 0-indexed
        const months = Array.isArray(sessionData?.months) ? sessionData.months.map((m) => m - 1) : [];
        setSessionMonths(months);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || 'Nu am putut încărca consultațiile.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableMonths = useMemo(() => {
    if (sessionMonths.length > 0) {
      return [...sessionMonths].sort((a, b) => a - b);
    }
    const months = [...new Set(consultations.map((item) => new Date(item.date).getMonth()))].sort((a, b) => a - b);
    return months.length ? months : [new Date().getMonth()];
  }, [consultations, sessionMonths]);

  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

  useEffect(() => {
    if (!availableMonths.includes(activeMonth)) {
      setActiveMonth(availableMonths[0]);
      setSelectedDate(null);
    }
  }, [activeMonth, availableMonths]);

  const activeYear = useMemo(() => {
    const firstInMonth = consultations.find((item) => new Date(item.date).getMonth() === activeMonth);
    return firstInMonth ? new Date(firstInMonth.date).getFullYear() : new Date().getFullYear();
  }, [activeMonth, consultations]);

  const availableYears = useMemo(() => {
    const years = [...new Set(consultations.map((item) => item.an).filter((item) => item && item !== '-'))].sort();
    return years.length ? years : ['1', '2', '3'];
  }, [consultations]);

  const faculties = useMemo(() => {
    return [...new Set(consultations.map((item) => item.facultate).filter((item) => item && item !== '-'))].sort((a, b) =>
      a.localeCompare(b, 'ro'),
    );
  }, [consultations]);

  const filteredConsultations = useMemo(() => {
    return consultations.filter((consultation) => {
      const date = new Date(consultation.date);
      const matchesMonth = date.getMonth() === activeMonth;
      const matchesYear = yearFilter === 'all' || consultation.an === yearFilter;
      const matchesFaculty = facultyFilter === 'all' || consultation.facultate === facultyFilter;
      return matchesMonth && matchesYear && matchesFaculty;
    });
  }, [activeMonth, consultations, facultyFilter, yearFilter]);

  const datesWithEvents = useMemo(() => {
    return new Set(filteredConsultations.map((consultation) => consultation.date));
  }, [filteredConsultations]);

  const selectedDayConsultations = useMemo(() => {
    if (!selectedDate) return [];
    return filteredConsultations.filter((consultation) => consultation.date === selectedDate);
  }, [filteredConsultations, selectedDate]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(activeYear, activeMonth, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
    const totalCells = startOffset + daysInMonth;
    const trailingEmptyCells = (7 - (totalCells % 7)) % 7;
    const cells = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ type: 'empty', key: `start-empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = formatDateKey(activeYear, activeMonth, day);
      cells.push({ type: 'day', key: dateKey, day, dateKey });
    }

    for (let i = 0; i < trailingEmptyCells; i += 1) {
      cells.push({ type: 'empty', key: `end-empty-${i}` });
    }

    return cells;
  }, [activeMonth, activeYear]);

  const selectedDateLabels = useMemo(() => {
    if (!selectedDate) {
      return {
        main: 'Selectează o zi',
        subtitle: 'din calendar',
      };
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const dayLabel = String(day).padStart(2, '0');
    const monthLabel = MONTH_NAMES[month - 1].toLowerCase();
    const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];

    return {
      main: `${dayLabel} ${monthLabel}`,
      subtitle: weekday,
    };
  }, [selectedDate]);

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const handleMonthChange = (month) => {
    if (!availableMonths.includes(month)) return;
    setActiveMonth(month);
    setSelectedDate(null);
  };

  const handleYearToggle = (year) => {
    setYearFilter((current) => (current === year ? 'all' : year));
  };

  return (
    <div className="body-calendar has-navbar app-background">
      <AppNavbar active="calendar" />
<div className="calendar-filters calendar-filters-top" aria-label="Filtre calendar">
        <div className="calendar-filter-group">
          <label>An</label>
          <div className="calendar-year-buttons" role="group" aria-label="Filtru an universitar">
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`calendar-year-button ${yearFilter === year ? 'active' : ''}`}
                data-year={year}
                onClick={() => handleYearToggle(year)}
              >
                Anul {year}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-filter-group">
          <label htmlFor="faculty-filter">Facultate</label>
          <select
            id="faculty-filter"
            className="calendar-filter-select"
            aria-label="Filtru facultate"
            value={facultyFilter}
            onChange={(event) => setFacultyFilter(event.target.value)}
          >
            <option value="all">Selectează facultatea</option>
            {faculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="calendar-container">
        <div className="calendar-info">
          {selectedDate ? (
            <>
              <h2 className="info-title">{selectedDateLabels.main}</h2>
              <p className="info-date">{selectedDateLabels.subtitle}</p>
            </>
          ) : null}
          <div className="consultations-list">
            {isLoading ? (
              <div className="no-consultations">
                <p className="info-title">Se incarca</p>
                <p className="info-date">consultațiile...</p>
              </div>
            ) : null}
            {!isLoading && error ? (
              <div className="no-consultations">
                <p className="info-title">Eroare</p>
                <p className="info-date">{error}</p>
              </div>
            ) : null}
            {!isLoading && !error && selectedDate ? (
              selectedDayConsultations.length > 0 ? (
                selectedDayConsultations.map((consultation) => (
                  <div className="consultation-card" key={consultation.id}>
                    <div className="consultation-time">
                      <span className="consultation-hour">{consultation.ora}</span>
                    </div>
                    <div className="consultation-details">
                      <p className="consultation-subject-title">{consultation.materie}</p>
                      <p className="consultation-student">Profesor: {consultation.profesor}</p>
                      <p className="consultation-series">Seria: {consultation.serie}</p>
                      <p className="consultation-year">
                        An: {consultation.an}
                        {consultation.facultate ? ` • ${consultation.facultate}` : ''}
                      </p>
                      <div className="consultation-card-actions">
                        <button
                          type="button"
                          className="consultation-details-btn"
                          onClick={() => setDetailsConsultation(consultation)}
                        >
                          Detalii
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-consultations">
                  <p className="info-title">Nicio consultație programată în această zi</p>
                </div>
              )
            ) : null}
            {!isLoading && !error && !selectedDate ? (
              <div className="empty-calendar-state" aria-hidden="true">
                <p>Alege o zi din calendar pentru a vedea consultațiile</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="calendar">
          <div className="calendar-header">
            <div className="calendar-month-tabs" role="tablist" aria-label="Selectare lună">
              {availableMonths.map((month) => (
                <button
                  key={month}
                  className={`calendar-month-tab ${activeMonth === month ? 'active' : ''}`}
                  role="tab"
                  aria-selected={activeMonth === month}
                  onClick={() => handleMonthChange(month)}
                  type="button"
                >
                  {MONTH_NAMES[month]}
                </button>
              ))}
            </div>
            <h2 className="calendar-month-year">{`${MONTH_NAMES[activeMonth]} ${activeYear}`}</h2>
          </div>
          <div className="calendar-grid-topbar" aria-hidden="true" />
          <div className="calendar-weekdays">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mie</span>
            <span>Joi</span>
            <span>Vin</span>
            <span>Sâm</span>
            <span>Dum</span>
          </div>
          <div className="calendar-days">
            {calendarCells.map((cell) => {
              if (cell.type === 'empty') {
                return <div key={cell.key} className="calendar-day calendar-day-empty" />;
              }

              const isToday = cell.dateKey === todayKey;
              const isSelected = cell.dateKey === selectedDate;
              const hasEvents = datesWithEvents.has(cell.dateKey);

              const dayClasses = [
                'calendar-day',
                isToday ? 'calendar-today' : '',
                isSelected ? 'calendar-selected' : '',
                hasEvents ? 'calendar-has-events' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button type="button" key={cell.key} className={dayClasses} onClick={() => setSelectedDate(cell.dateKey)}>
                  <span className="calendar-day-number">{cell.day}</span>
                  {hasEvents ? <span className="calendar-event-dot" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="modal-overlay"
        id="modal-details"
        hidden={!detailsConsultation}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setDetailsConsultation(null);
          }
        }}
      >
        <div className="modal-card modal-card-wide">
          <div className="modal-header">
            <h3 id="modal-details-title">{detailsConsultation?.materie || 'Detalii consultație'}</h3>
            <button className="modal-close" id="modal-details-close" onClick={() => setDetailsConsultation(null)} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-details-body" id="modal-details-body">
            <div className="detail-row">
              <span className="detail-label">Profesor</span>
              <span className="detail-value">{detailsConsultation?.profesor || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ora</span>
              <span className="detail-value">{detailsConsultation?.ora || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Seria</span>
              <span className="detail-value">{detailsConsultation?.serie || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">An</span>
              <span className="detail-value">{detailsConsultation?.an ? `Anul ${detailsConsultation.an}` : '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Facultate</span>
              <span className="detail-value">{detailsConsultation?.facultate || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{detailsConsultation?.tip === 'online' ? 'Link întâlnire' : 'Sală'}</span>
              <span className="detail-value">
                {detailsConsultation?.tip === 'online' ? (
                  detailsConsultation?.link ? (
                    <a
                      className="detail-link"
                      href={detailsConsultation.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link întâlnire
                    </a>
                  ) : '-'
                ) : (detailsConsultation?.sala || '-')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Link materiale</span>
              <span className="detail-value">
                {detailsConsultation?.materialeLink ? (
                  <Link
                    className="detail-link"
                    to={detailsConsultation.materialeFolderId
                      ? `/drive?folderId=${encodeURIComponent(detailsConsultation.materialeFolderId)}`
                      : '/drive'}
                  >
                    Link materiale
                  </Link>
                ) : '-'}
              </span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="button-confirm" id="modal-details-ok" onClick={() => setDetailsConsultation(null)} type="button">
              Închide
            </button>
          </div>
        </div>
      </div>
      <AppBottomNav active="calendar" />
      <AppFooter />
    </div>
  );
}

export default Calendar;
