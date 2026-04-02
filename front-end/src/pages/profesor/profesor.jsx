import React, { useEffect, useMemo, useState } from 'react';
import { consultationApi, courseApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/section.css';
import '../../css/components/forms.css';
import '../../css/components/modal.css';
import '../dashboard/dashboard.css';
import './styles.css';

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

const toDateTime = (dateStr, ora) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (ora || '00:00').slice(0, 5).split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

const isFuture = (dateStr, ora) => toDateTime(dateStr, ora) >= new Date();

const normalizeCourse = (course) => ({
  id: course.id,
  name: course.name,
  faculty: course.faculty?.abbreviation || '-',
  years: course.studyYear ? [course.studyYear] : [],
});

const normalizeConsultation = (item) => ({
  id: item.id,
  courseId: item.courseId,
  materie: item.course?.name || '-',
  data: item.date,
  ora: item.time?.slice(0, 5) || '-',
  durata: item.duration || 120,
  tip: item.type || 'fizic',
  locatie: item.type === 'online' ? item.meetingLink || '' : item.room || '',
  materialsLink: item.materialsLink || '',
  serie: item.serie || 'Toate',
  status: item.status || 'published',
});

function Profesor() {
  const [courses, setCourses] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [consultationModal, setConsultationModal] = useState(null);
  const [deleteConsultationId, setDeleteConsultationId] = useState(null);

  const [consultationForm, setConsultationForm] = useState({
    id: null,
    courseId: '',
    data: '',
    ora: '',
    durata: 120,
    tip: 'fizic',
    locatie: '',
    materialsLink: '',
    serie: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [coursesResponse, consultationsResponse] = await Promise.all([
        courseApi.getMyCourses(),
        consultationApi.getProfessorConsultations(),
      ]);

      setCourses((coursesResponse || []).map(normalizeCourse));
      setConsultations((consultationsResponse || []).map(normalizeConsultation));
    } catch (loadError) {
      setError(loadError.message || 'Nu am putut încărca datele profesorului.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcomingConsultations = useMemo(
    () =>
      consultations
        .filter((item) => item.status === 'published' && isFuture(item.data, item.ora))
        .sort((a, b) => toDateTime(a.data, a.ora) - toDateTime(b.data, b.ora)),
    [consultations],
  );

  const pastConsultations = useMemo(
    () =>
      consultations
        .filter((item) => item.status !== 'published' || !isFuture(item.data, item.ora))
        .sort((a, b) => toDateTime(b.data, b.ora) - toDateTime(a.data, a.ora)),
    [consultations],
  );

  const openAddConsultationModal = () => {
    setConsultationModal('create');
    setConsultationForm({
      id: null,
      courseId: courses[0]?.id || '',
      data: '',
      ora: '',
      durata: 120,
      tip: 'fizic',
      locatie: '',
      materialsLink: '',
      serie: '',
    });
  };

  const openEditConsultationModal = (consultation) => {
    setConsultationModal('edit');
    setConsultationForm({
      id: consultation.id,
      courseId: consultation.courseId,
      data: consultation.data,
      ora: consultation.ora,
      durata: consultation.durata,
      tip: consultation.tip,
      locatie: consultation.locatie,
      materialsLink: consultation.materialsLink,
      serie: consultation.serie === 'Toate' ? '' : consultation.serie,
    });
  };

  const saveConsultationForm = async () => {
    if (!consultationForm.courseId || !consultationForm.data || !consultationForm.ora) {
      return;
    }

    const payload = {
      courseId: Number(consultationForm.courseId),
      date: consultationForm.data,
      time: consultationForm.ora,
      duration: Number(consultationForm.durata) || 120,
      type: consultationForm.tip,
      materialsLink: consultationForm.materialsLink || null,
      serie: consultationForm.serie.trim() || 'Toate',
    };

    if (consultationForm.tip === 'online') {
      payload.meetingLink = consultationForm.locatie || null;
      payload.room = null;
    } else {
      payload.room = consultationForm.locatie || null;
      payload.meetingLink = null;
    }

    try {
      if (consultationModal === 'edit' && consultationForm.id) {
        await consultationApi.updateConsultation(consultationForm.id, payload);
      } else {
        await consultationApi.createConsultation(payload);
      }

      setConsultationModal(null);
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Nu am putut salva consultația.');
    }
  };

  const confirmDeleteConsultation = async () => {
    if (!deleteConsultationId) return;

    try {
      await consultationApi.deleteConsultation(deleteConsultationId);
      setDeleteConsultationId(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || 'Nu am putut șterge consultația.');
    }
  };

  return (
    <div className="has-navbar app-background">
      <AppNavbar active="dashboard" />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Dashboard Profesor</h1>
          </div>
        </div>

        {isLoading ? <p>Se încarcă datele...</p> : null}
        {error ? <p>{error}</p> : null}

        {!isLoading ? (
          <>
            <div className="dashboard-section">
              <div className="section-header section-header-col section-header-center">
                <h3>
                  Materiile mele
                  <span className="section-badge">{courses.length}</span>
                </h3>
              </div>
              <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                Atribuirea materiilor pentru profesori se gestionează din panoul Admin.
              </p>
              <div className="courses-grid">
                {courses.map((course) => (
                  <article className="course-card" key={course.id}>
                    <p className="course-card-name">{course.name}</p>
                    <p className="course-card-faculty">{course.faculty}</p>
                    <div className="course-card-years">
                      {course.years.length
                        ? course.years.map((year) => (
                          <span className="course-card-year" key={`${course.id}-${year}`}>
                            Anul {year}
                          </span>
                          ))
                        : <span className="course-card-year">N/A</span>}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header section-header-col section-header-center">
                <h3>
                  Consultațiile mele
                  <span className="section-badge">{upcomingConsultations.length}</span>
                </h3>
                <button className="button-edit button-wide" type="button" onClick={openAddConsultationModal}>
                  <i className="fa-solid fa-plus" />
                  <span>Consultație nouă</span>
                </button>
              </div>
              <div className="consultations-dash-grid">
                {upcomingConsultations.length
                  ? upcomingConsultations.map((consultation) => (
                    <div className="consultation-dash-card" key={consultation.id}>
                      <div className="dash-card-main">
                        <h4 className="dash-card-discipline">{consultation.materie}</h4>
                        <p className="dash-card-series">Seria: {consultation.serie}</p>
                      </div>
                      <div className="dash-card-meta">
                        <p className="dash-card-time">{consultation.ora}</p>
                        <p className="dash-card-date">{formatDate(consultation.data)}</p>
                      </div>
                      <div className="prof-card-actions">
                        <button className="btn-row-edit" type="button" onClick={() => openEditConsultationModal(consultation)}>
                          Editează
                        </button>
                        <button className="btn-row-delete" type="button" onClick={() => setDeleteConsultationId(consultation.id)}>
                          Șterge
                        </button>
                      </div>
                    </div>
                    ))
                  : (
                    <div className="no-consultations-dash">
                      <i className="fa-regular fa-calendar-xmark" />
                      <p>Nicio consultație programată.</p>
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
                    ? pastConsultations.map((consultation) => (
                      <div className="consultation-dash-card" key={consultation.id}>
                        <div className="dash-card-main">
                          <h4 className="dash-card-discipline">{consultation.materie}</h4>
                          <p className="dash-card-series">Seria: {consultation.serie}</p>
                        </div>
                        <div className="dash-card-meta">
                          <p className="dash-card-time">{consultation.ora}</p>
                          <p className="dash-card-date">{formatDate(consultation.data)}</p>
                        </div>
                      </div>
                      ))
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
        hidden={!consultationModal}
        onClick={(event) => {
          if (event.target === event.currentTarget) setConsultationModal(null);
        }}
      >
        <div className="modal-card modal-card-wide">
          <div className="modal-header">
            <h3>{consultationModal === 'edit' ? 'Editează consultația' : 'Consultație nouă'}</h3>
            <button className="modal-close" type="button" onClick={() => setConsultationModal(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-form-body">
            <div className="form-group">
              <label htmlFor="form-materie">Materie</label>
              <select
                id="form-materie"
                value={consultationForm.courseId}
                onChange={(event) => setConsultationForm((current) => ({ ...current, courseId: event.target.value }))}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="form-data">Data</label>
                <input
                  id="form-data"
                  type="date"
                  value={consultationForm.data}
                  onChange={(event) => setConsultationForm((current) => ({ ...current, data: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="form-ora">Ora</label>
                <input
                  id="form-ora"
                  type="time"
                  value={consultationForm.ora}
                  onChange={(event) => setConsultationForm((current) => ({ ...current, ora: event.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="form-tip">Tip</label>
                <select
                  id="form-tip"
                  value={consultationForm.tip}
                  onChange={(event) => setConsultationForm((current) => ({ ...current, tip: event.target.value }))}
                >
                  <option value="fizic">fizic</option>
                  <option value="online">online</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="form-serie">Serie</label>
                <input
                  id="form-serie"
                  value={consultationForm.serie}
                  onChange={(event) => setConsultationForm((current) => ({ ...current, serie: event.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="form-locatie">{consultationForm.tip === 'online' ? 'Link meeting' : 'Sală'}</label>
              <input
                id="form-locatie"
                value={consultationForm.locatie}
                onChange={(event) => setConsultationForm((current) => ({ ...current, locatie: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="form-duration">Durată (minute)</label>
              <input
                id="form-duration"
                type="number"
                min={30}
                step={15}
                value={consultationForm.durata}
                onChange={(event) => setConsultationForm((current) => ({ ...current, durata: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="form-materials">Link materiale (opțional)</label>
              <input
                id="form-materials"
                value={consultationForm.materialsLink}
                onChange={(event) => setConsultationForm((current) => ({ ...current, materialsLink: event.target.value }))}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="button-cancel" type="button" onClick={() => setConsultationModal(null)}>
              Anulează
            </button>
            <button className="button-confirm" type="button" onClick={saveConsultationForm}>
              Salvează
            </button>
          </div>
        </div>
      </div>

      <div className="modal-overlay" hidden={!deleteConsultationId}>
        <div className="modal-card" style={{ maxWidth: '520px' }}>
          <div className="modal-header">
            <h3>Șterge consultația</h3>
            <button className="modal-close" type="button" onClick={() => setDeleteConsultationId(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <p className="modal-warning">Ești sigur că vrei să ștergi această consultație?</p>
          <div className="modal-actions">
            <button className="button-cancel" type="button" onClick={() => setDeleteConsultationId(null)}>
              Anulează
            </button>
            <button className="button-confirm button-danger" type="button" onClick={confirmDeleteConsultation}>
              Șterge
            </button>
          </div>
        </div>
      </div>

      <AppBottomNav active="dashboard" />
      <AppFooter />
    </div>
  );
}

export default Profesor;
