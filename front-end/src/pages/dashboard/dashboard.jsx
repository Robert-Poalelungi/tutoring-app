import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { consultationApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/section.css';
import '../../css/components/forms.css';
import '../../css/components/modal.css';
import './dashboard.css';

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

const normalizeConsultation = (item) => {
  const professorName = `${item.professor?.firstName || ''} ${item.professor?.lastName || ''}`.trim();
  const location = item.type === 'online' ? item.meetingLink : item.room;

  return {
    id: item.id,
    disciplina: item.course?.name || '-',
    cadruDidactic: professorName || '-',
    date: item.date,
    ora: item.time?.slice(0, 5) || '-',
    durata: `${item.duration || 120} min`,
    tip: item.type,
    locatie: location || '-',
    an: item.course?.studyYear || '-',
    specializare: item.course?.specialization?.name || '-',
    serie: item.serie || 'Toate',
    status: item.status,
    source: item.enrollmentSource || 'auto',
  };
};

function Dashboard() {
  const [detailsConsultation, setDetailsConsultation] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [allConsultations, setAllConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadConsultations = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await consultationApi.getStudentConsultations();
        if (!isMounted) return;

        const auto = (response?.auto || []).map(normalizeConsultation);
        const manual = (response?.manual || []).map(normalizeConsultation);
        setAllConsultations([...auto, ...manual].sort(sortByDateAsc));
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || 'Nu am putut încărca dashboard-ul.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadConsultations();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const renderConsultationCard = (consultation, showSourceBadge = false) => (
    <div className="consultation-dash-card" key={consultation.id}>
      <div className="dash-card-meta">
        <p className="dash-card-time">{consultation.ora}</p>
        <p className="dash-card-date">{formatDate(consultation.date)}</p>
        {showSourceBadge ? <p className="dash-card-year-badge">{consultation.source === 'manual' ? 'Manual' : 'Auto'}</p> : null}
      </div>
      <div className="dash-card-main">
        <h4 className="dash-card-discipline">{consultation.disciplina}</h4>
        <p className="dash-card-teacher">{consultation.cadruDidactic}</p>
        <p className="dash-card-series">Seria: {consultation.serie}</p>
      </div>
      <button className="button-details" type="button" onClick={() => setDetailsConsultation(consultation)}>
        Detalii
      </button>
    </div>
  );

  return (
    <div className="has-navbar app-background">
      <AppNavbar active="dashboard" />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Dashboard Student</h1>
            <Link className="button-sync-calendar" to="/profil">
              <i className="fa-brands fa-google" />
              <span>Sincronizare Google Calendar</span>
            </Link>
          </div>
        </div>

        {isLoading ? <p>Se incarca dashboard-ul...</p> : null}
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
              </div>
              <div className="consultations-dash-grid">
                {extraConsultations.length
                  ? extraConsultations.map((consultation) => renderConsultationCard(consultation, true))
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
                <span className="detail-label">Cadru didactic</span>
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
                <span className="detail-label">Locație</span>
                <span className="detail-value">{detailsConsultation.locatie}</span>
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

      <AppBottomNav active="dashboard" />
      <AppFooter />
    </div>
  );
}

export default Dashboard;
