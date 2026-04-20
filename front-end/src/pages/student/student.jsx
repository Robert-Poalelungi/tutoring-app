import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { consultationApi, googleCalendarApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/section.css';
import '../../css/components/forms.css';
import '../../css/components/modal.css';
import './student.css';

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

const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

const toDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').slice(0, 5).split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

const isFuture = (dateStr, timeStr) => toDateTime(dateStr, timeStr) >= new Date();

const sortByDateAsc = (a, b) => toDateTime(a.date, a.ora) - toDateTime(b.date, b.ora);

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

const normalizeConsultation = (item) => {
  const professorName = `${item.professor?.firstName || ''} ${item.professor?.lastName || ''}`.trim();

  return {
    id: item.id,
    disciplina: item.course?.name || '-',
    cadruDidactic: professorName || '-',
    date: item.date,
    ora: item.time?.slice(0, 5) || '-',
    durata: `${item.duration || 120} min`,
    tip: item.type || 'fizic',
    link: normalizeExternalUrl(item.meetingLink),
    sala: item.room || '',
    materialeLink: normalizeExternalUrl(item.materialsLink),
    materialeFolderId: extractDriveFolderId(item.materialsLink),
    an: item.course?.studyYear || '-',
    specializare: item.course?.specialization?.name || '-',
    serie: item.serie || 'Toate',
    status: item.status,
    source: item.enrollmentSource || 'auto',
  };
};

function Student() {
  const [detailsConsultation, setDetailsConsultation] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [allConsultations, setAllConsultations] = useState([]);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [availableConsultations, setAvailableConsultations] = useState([]);
  const [manualSearch, setManualSearch] = useState('');
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualModalError, setManualModalError] = useState('');
  const [isCalendarStatusLoading, setIsCalendarStatusLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudentConsultations = async () => {
    const response = await consultationApi.getStudentConsultations();
    const auto = (response?.auto || []).map(normalizeConsultation);
    const manual = (response?.manual || []).map(normalizeConsultation);
    return [...auto, ...manual].sort(sortByDateAsc);
  };

  useEffect(() => {
    let isMounted = true;

    const loadConsultations = async () => {
      setIsLoading(true);
      setError('');
      try {
        const nextConsultations = await loadStudentConsultations();
        if (!isMounted) return;
        setAllConsultations(nextConsultations);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || 'Nu am putut încărca pagina de student.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadConsultations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCalendarStatus = async () => {
      setIsCalendarStatusLoading(true);
      try {
        const status = await googleCalendarApi.getStatus();
        if (!isMounted) return;
        setCalendarConnected(Boolean(status?.connected));
      } catch {
        if (!isMounted) return;
        setCalendarConnected(false);
      } finally {
        if (isMounted) setIsCalendarStatusLoading(false);
      }
    };

    loadCalendarStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddManualModal = async () => {
    setShowAddManualModal(true);
    setManualSearch('');
    setManualModalError('');
    setIsLoadingAvailable(true);

    try {
      const publicConsultations = await consultationApi.getPublicConsultations();
      const enrolledIds = new Set(allConsultations.map((entry) => entry.id));
      const nextAvailable = (publicConsultations || [])
        .map(normalizeConsultation)
        .filter((entry) => entry.status === 'published' && isFuture(entry.date, entry.ora) && !enrolledIds.has(entry.id))
        .sort(sortByDateAsc);

      setAvailableConsultations(nextAvailable);
    } catch (loadError) {
      setManualModalError(loadError.message || 'Nu am putut încărca consultațiile disponibile.');
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const closeAddManualModal = () => {
    setShowAddManualModal(false);
    setAvailableConsultations([]);
    setManualSearch('');
    setManualModalError('');
  };

  const filteredAvailableConsultations = useMemo(() => {
    const query = manualSearch.trim().toLowerCase();
    if (!query) {
      return availableConsultations;
    }

    return availableConsultations.filter((consultation) => {
      const dateText = formatDate(consultation.date).toLowerCase();
      return consultation.disciplina.toLowerCase().includes(query)
        || consultation.cadruDidactic.toLowerCase().includes(query)
        || consultation.serie.toLowerCase().includes(query)
        || consultation.ora.toLowerCase().includes(query)
        || dateText.includes(query);
    });
  }, [availableConsultations, manualSearch]);

  const addManualConsultation = async (consultationId) => {
    setManualModalError('');
    setIsSubmittingManual(true);
    try {
      await consultationApi.enroll(consultationId);
      const nextConsultations = await loadStudentConsultations();
      setAllConsultations(nextConsultations);
      setAvailableConsultations((current) => current.filter((entry) => entry.id !== consultationId));
    } catch (submitError) {
      setManualModalError(submitError.message || 'Nu am putut adăuga consultația.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const removeManualConsultation = async (consultationId) => {
    setError('');
    try {
      await consultationApi.unenroll(consultationId);
      const nextConsultations = await loadStudentConsultations();
      setAllConsultations(nextConsultations);
    } catch (submitError) {
      setError(submitError.message || 'Nu am putut sterge consultatia.');
    }
  };

  const currentConsultations = useMemo(
    () =>
      allConsultations
        .filter((item) => item.status === 'published' && isFuture(item.date, item.ora))
        .sort(sortByDateAsc),
    [allConsultations],
  );

  const extraConsultations = useMemo(
    () =>
      allConsultations
        .filter((item) => item.source === 'manual' && item.status === 'published' && isFuture(item.date, item.ora))
        .sort(sortByDateAsc),
    [allConsultations],
  );

  const pastConsultations = useMemo(
    () =>
      allConsultations
        .filter((item) => !isFuture(item.date, item.ora) || item.status !== 'published')
        .sort((a, b) => toDateTime(b.date, b.ora) - toDateTime(a.date, a.ora)),
    [allConsultations],
  );

  const renderConsultationCard = (consultation, showSourceBadge = false, showDeleteButton = false) => (
    <div className="consultation-dash-card" key={consultation.id}>
      <div className="dash-card-meta">
        <p className="dash-card-time">{consultation.ora}</p>
        <p className="dash-card-date">{formatDate(consultation.date)}</p>
        {showSourceBadge ? <p className="dash-card-year-badge">{consultation.source === 'manual' ? 'Manual' : 'Auto'}</p> : null}
      </div>
      <div className="dash-card-main">
        <h4 className="dash-card-discipline">{consultation.disciplina}</h4>
        <p className="dash-card-teacher">Profesor: {consultation.cadruDidactic}</p>
        <p className="dash-card-series">Seria: {consultation.serie}</p>
      </div>
      <div className="dash-card-actions">
        <button className="button-details" type="button" onClick={() => setDetailsConsultation(consultation)}>
          Detalii
        </button>
        {showDeleteButton ? (
          <button
            className="button-details button-details-delete"
            type="button"
            onClick={() => removeManualConsultation(consultation.id)}
          >
            Sterge
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="has-navbar app-background">
      <AppNavbar active="student" />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            {!isCalendarStatusLoading && !calendarConnected ? (
              <Link className="button-sync-calendar" to="/setari">
                <i className="fa-brands fa-google" />
                <span>Sincronizare cu Google Calendar</span>
              </Link>
            ) : null}
          </div>
        </div>

        {isLoading ? <p>Se încarcă pagina de student...</p> : null}
        {error ? <p>{error}</p> : null}

        {!isLoading && !error ? (
          <>
            <div className="dashboard-section">
              <div className="section-header">
                <h3>
                  Consultatiile mele
                  <span className="section-badge">{currentConsultations.length}</span>
                </h3>
              </div>
              <div className="consultations-dash-grid">
                {currentConsultations.length
                  ? currentConsultations.map((consultation) => renderConsultationCard(consultation))
                  : (
                    <div className="no-consultations-dash">
                      <i className="fa-regular fa-calendar-xmark" />
                      <p>Nicio consultație publicată momentan.</p>
                    </div>
                    )}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header section-header-col section-header-center">
                <h3>
                  Consultații adăugate manual
                  <span className="section-badge">{extraConsultations.length}</span>
                </h3>
                <button className="button-edit button-wide" type="button" onClick={openAddManualModal}>
                  <i className="fa-solid fa-plus" />
                  <span>Adaugă</span>
                </button>
              </div>
              <div className="consultations-dash-grid">
                {extraConsultations.length
                  ? extraConsultations.map((consultation) => renderConsultationCard(consultation, true, true))
                  : (
                    <div className="no-consultations-dash">
                      <i className="fa-solid fa-layer-group" />
                      <p>Nu ai consultații adăugate manual.</p>
                    </div>
                    )}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header section-header-col section-header-center">
                <h3>
                  Consultații trecute
                  <span className="section-badge">{pastConsultations.length}</span>
                </h3>
                <button className="button-edit button-wide" type="button" onClick={() => setShowPast((current) => !current)}>
                  <i className={`fa-solid ${showPast ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                  <span>{showPast ? 'Ascunde' : 'Arată'}</span>
                </button>
              </div>
              <div className="past-consultations-wrapper" hidden={!showPast}>
                <div className="consultations-dash-grid">
                  {pastConsultations.length
                    ? pastConsultations.map((consultation) => renderConsultationCard(consultation))
                    : (
                      <div className="no-consultations-dash">
                        <i className="fa-regular fa-clock" />
                        <p>Nu există consultații trecute.</p>
                      </div>
                      )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div
        className="modal-overlay"
        hidden={!showAddManualModal}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeAddManualModal();
          }
        }}
      >
        <div className="modal-card modal-card-wide">
          <div className="modal-header">
            <h3>Adaugă consultație manuală</h3>
            <button className="modal-close" type="button" onClick={closeAddManualModal}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {manualModalError ? <p className="error-text">{manualModalError}</p> : null}

          <div className="manual-consultations-search">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="manual-consultations-search">Caută consultație</label>
              <input
                id="manual-consultations-search"
                type="text"
                value={manualSearch}
                onChange={(event) => setManualSearch(event.target.value)}
                placeholder="Materie, profesor, serie, dată sau oră"
              />
            </div>
          </div>

          <div className="manual-consultations-list">
            {isLoadingAvailable ? <p>Se încarcă consultațiile...</p> : null}

            {!isLoadingAvailable && filteredAvailableConsultations.length === 0 ? (
              <p className="empty-state">Nu există consultații disponibile pentru adăugare.</p>
            ) : null}

            {!isLoadingAvailable
              ? filteredAvailableConsultations.map((consultation) => (
                <article className="consultation-dash-card" key={consultation.id}>
                  <div className="dash-card-meta">
                    <p className="dash-card-time">{consultation.ora}</p>
                    <p className="dash-card-date">{formatDate(consultation.date)}</p>
                  </div>
                  <div className="dash-card-main">
                    <h4 className="dash-card-discipline">{consultation.disciplina}</h4>
                    <p className="dash-card-teacher">{consultation.cadruDidactic}</p>
                    <p className="dash-card-series">Seria: {consultation.serie}</p>
                  </div>
                  <button
                    className="button-confirm"
                    type="button"
                    disabled={isSubmittingManual}
                    onClick={() => addManualConsultation(consultation.id)}
                  >
                    {isSubmittingManual ? 'Se adaugă...' : 'Adaugă'}
                  </button>
                </article>
              ))
              : null}
          </div>

          <div className="modal-actions">
            <button className="button-cancel" type="button" onClick={closeAddManualModal}>
              Închide
            </button>
          </div>
        </div>
      </div>

      <div
        className="modal-overlay"
        hidden={!detailsConsultation}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setDetailsConsultation(null);
          }
        }}
      >
        <div className="modal-card modal-card-wide">
          <div className="modal-header">
            <h3>{detailsConsultation?.disciplina}</h3>
            <button className="modal-close" type="button" onClick={() => setDetailsConsultation(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          {detailsConsultation ? (
            <div className="modal-details-body">
              <div className="detail-row">
                <span className="detail-label">Profesor</span>
                <span className="detail-value">{detailsConsultation.cadruDidactic}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Data</span>
                <span className="detail-value">{formatDate(detailsConsultation.date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ora</span>
                <span className="detail-value">{detailsConsultation.ora} ({detailsConsultation.durata})</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{detailsConsultation.tip === 'online' ? 'Link întâlnire' : 'Sală'}</span>
                <span className="detail-value">
                  {detailsConsultation.tip === 'online' ? (
                    detailsConsultation.link ? (
                      <a
                        className="detail-link"
                        href={detailsConsultation.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Link întâlnire
                      </a>
                    ) : '-'
                  ) : (detailsConsultation.sala || '-')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Link materiale</span>
                <span className="detail-value">
                  {detailsConsultation.materialeLink ? (
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
          ) : null}
          <div className="modal-actions">
            <button className="button-confirm" type="button" onClick={() => setDetailsConsultation(null)}>
              Închide
            </button>
          </div>
        </div>
      </div>

      <AppBottomNav active="student" />
      <AppFooter />
    </div>
  );
}

export default Student;
