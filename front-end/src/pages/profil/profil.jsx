import React, { useEffect, useMemo, useState } from 'react';
import { profileApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import { useAuth } from '../../context/useAuth';
import { getRoleLabel } from '../../utils/navigation';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/section.css';
import '../../css/components/forms.css';
import '../../css/components/chips.css';
import '../../css/components/modal.css';
import '../student/student.css';
import './profil.css';

const mapProfileFromUser = (user) => ({
  nume: user.lastName || '',
  prenume: user.firstName || '',
  email: user.email || '',
  an: user.studyYear || 1,
  specializare: user.specialization?.name || '',
  facultyAbbr: user.faculty?.abbreviation || '',
  facultyId: user.facultyId || null,
  specializationId: user.specializationId || null,
  serie: user.serie || '',
});

const getInitials = (profile) => `${profile.prenume?.[0] || ''}${profile.nume?.[0] || ''}`.toUpperCase();

function Profil() {
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === 'student';
  const isProfessor = user?.role === 'professor';

  const professorFaculties = useMemo(() => {
    if (!isProfessor || !user?.courses) return [];
    const seen = new Set();
    return user.courses
      .map((c) => c.faculty)
      .filter((f) => f && !seen.has(f.id) && seen.add(f.id));
  }, [isProfessor, user?.courses]);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [selectedNewFaculty, setSelectedNewFaculty] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [error, setError] = useState('');

  const profile = useMemo(() => (user ? mapProfileFromUser(user) : null), [user]);
  const activeProfile = isEditing && draftProfile ? draftProfile : profile;
  const formProfile = draftProfile || profile;

  useEffect(() => {
    let isMounted = true;

    const loadFaculties = async () => {
      try {
        const data = await profileApi.getFaculties();
        if (isMounted) setFaculties(data || []);
      } catch {
        if (isMounted) setFaculties([]);
      }
    };

    loadFaculties();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSpecializations = async () => {
      const facultyId = draftProfile?.facultyId || profile?.facultyId;

      if (!facultyId) {
        setSpecializations([]);
        return;
      }

      try {
        const data = await profileApi.getSpecializations(facultyId);
        if (isMounted) setSpecializations(data || []);
      } catch {
        if (isMounted) setSpecializations([]);
      }
    };

    loadSpecializations();

    return () => {
      isMounted = false;
    };
  }, [draftProfile?.facultyId, profile?.facultyId]);

  const currentFaculty = useMemo(
    () => faculties.find((faculty) => faculty.abbreviation === activeProfile?.facultyAbbr),
    [activeProfile?.facultyAbbr, faculties],
  );

  const handleFieldChange = (field, value) => {
    setDraftProfile((current) => ({ ...(current || profile), [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!draftProfile) return;

    setError('');
    try {
      const payload = {
        firstName: draftProfile.prenume,
        lastName: draftProfile.nume,
        facultyId: draftProfile.facultyId,
      };

      if (isStudent) {
        payload.specializationId = draftProfile.specializationId;
        payload.studyYear = Number(draftProfile.an);
        payload.serie = draftProfile.serie || null;
      }

      await profileApi.updateProfile({
        ...payload,
      });

      await refreshUser();
      setIsEditing(false);
      setDraftProfile(null);
    } catch (saveError) {
      setError(saveError.message || 'Nu am putut salva profilul.');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveProfile();
      return;
    }

    setDraftProfile(profile);
    setIsEditing(true);
  };

  const handleOpenFacultyModal = () => {
    if (!isEditing && profile) {
      setDraftProfile(profile);
      setIsEditing(true);
    }
    setSelectedNewFaculty(null);
    setShowFacultyModal(true);
  };

  const handleConfirmFacultyChange = () => {
    if (!selectedNewFaculty || !draftProfile) {
      setShowFacultyModal(false);
      return;
    }

    const selectedFacultyObj = faculties.find((faculty) => faculty.abbreviation === selectedNewFaculty);

    setDraftProfile((current) => ({
      ...current,
      facultyAbbr: selectedNewFaculty,
      facultyId: selectedFacultyObj?.id || null,
      specializare: '',
      specializationId: null,
    }));

    setShowFacultyModal(false);
  };

  if (!profile || !activeProfile) {
    return null;
  }

  const initials = getInitials(activeProfile) || 'PR';

  const headerStyle = {
    width: 'min(var(--page-max-width), calc(100vw - var(--page-gutter)))',
    margin: '1rem auto 0',
    padding: '0 0.5rem',
  };

  return (
    <div className="profile-body has-navbar app-background">
      <AppNavbar active="" profileMenuActive />
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <span className="avatar-initials">{initials}</span>
          </div>
          <h2 className="profile-name">{`${activeProfile.prenume} ${activeProfile.nume}`}</h2>
          <p className="profile-role">{getRoleLabel(user?.role)}</p>
          <p className="profile-email-sidebar">{activeProfile.email}</p>
          {isProfessor ? (
            professorFaculties.length > 0
              ? professorFaculties.map((f) => (
                <p key={f.id} className="profile-email-sidebar profile-sidebar-badge">{f.abbreviation}</p>
              ))
              : null
          ) : isStudent && activeProfile.facultyAbbr ? (
            <p className="profile-email-sidebar profile-sidebar-badge">{activeProfile.facultyAbbr}</p>
          ) : null}
          {isStudent ? (
            <p className="profile-email-sidebar profile-sidebar-badge">
              Anul <span>{activeProfile.an}</span>
            </p>
          ) : null}
        </div>
        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h3>Informații Personale</h3>
              <button
                className={`button-edit ${isEditing ? 'button-save' : ''}`}
                id="button-edit-personal"
                type="button"
                onClick={handleEditToggle}
              >
                <span>{isEditing ? 'Salvează' : 'Editează'}</span>
              </button>
            </div>
            <div className="section-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="input-nume">Nume</label>
                  <input
                    type="text"
                    id="input-nume"
                    disabled={!isEditing}
                    value={formProfile?.nume || ''}
                    onChange={(event) => handleFieldChange('nume', event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="input-prenume">Prenume</label>
                  <input
                    type="text"
                    id="input-prenume"
                    disabled={!isEditing}
                    value={formProfile?.prenume || ''}
                    onChange={(event) => handleFieldChange('prenume', event.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="input-email">Email</label>
                <input
                  type="email"
                  id="input-email"
                  disabled
                  className="input-locked"
                  value={activeProfile.email}
                  readOnly
                />
              </div>
              {isStudent ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="input-an">An universitar</label>
                      <select
                        id="input-an"
                        disabled={!isEditing}
                        value={formProfile?.an || 1}
                        onChange={(event) => handleFieldChange('an', Number(event.target.value))}
                      >
                        <option value={1}>Anul 1</option>
                        <option value={2}>Anul 2</option>
                        <option value={3}>Anul 3</option>
                        <option value={4}>Anul 4 (Master 1)</option>
                        <option value={5}>Anul 5 (Master 2)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-specializare">Specializare</label>
                      {isEditing ? (
                        <select
                          id="input-specializare"
                          value={formProfile?.specializationId || ''}
                          onChange={(event) => {
                            const id = Number(event.target.value);
                            const selected = specializations.find((item) => item.id === id);
                            setDraftProfile((current) => ({
                              ...(current || profile),
                              specializationId: id,
                              specializare: selected?.name || '',
                            }));
                          }}
                        >
                          <option value="" disabled>
                            Selectează specializarea
                          </option>
                          {specializations.map((specialization) => (
                            <option key={specialization.id} value={specialization.id}>
                              {specialization.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="input-specializare"
                          type="text"
                          className="input-locked"
                          value={activeProfile?.specializare || '-'}
                          readOnly
                          disabled
                        />
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="input-serie">Serie</label>
                    <input
                      type="text"
                      id="input-serie"
                      disabled={!isEditing}
                      value={formProfile?.serie || ''}
                      onChange={(event) => handleFieldChange('serie', event.target.value.toUpperCase())}
                    />
                  </div>
                </>
              ) : null}
              {error ? <p>{error}</p> : null}
            </div>
          </div>

          {isStudent ? (
            <div className="profile-section">
              <div className="section-header">
                <h3>Facultate</h3>
                <button className="button-edit" id="button-change-faculty" type="button" onClick={handleOpenFacultyModal}>
                  <span>Schimbă</span>
                </button>
              </div>
              <div className="section-body">
                <div className="faculty-card">
                  <div className="faculty-info">
                    <p className="faculty-name">{currentFaculty?.name || '-'}</p>
                    <p className="faculty-abbr">{currentFaculty?.abbreviation || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </div>

      <div
        className="modal-overlay"
        id="modal-faculty"
        hidden={!showFacultyModal}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setShowFacultyModal(false);
          }
        }}
      >
        <div className="modal-card">
          <div className="modal-header">
            <h3>Schimbă Facultatea</h3>
            <button className="modal-close" id="modal-faculty-close" type="button" onClick={() => setShowFacultyModal(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <p className="modal-warning">
            {isStudent
              ? 'Schimbarea facultății va reseta specializarea și disciplinele suplimentare.'
              : 'Schimbarea facultății va actualiza afilierea contului tău.'}
          </p>
          <div className="faculty-grid" id="faculty-grid">
            {faculties.map((faculty) => {
              const isCurrent = faculty.abbreviation === activeProfile.facultyAbbr;
              const isSelected = selectedNewFaculty === faculty.abbreviation;

              return (
                <div
                  key={faculty.id}
                  className={`faculty-grid-card ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
                  role="button"
                  tabIndex={isCurrent ? -1 : 0}
                  onClick={() => {
                    if (!isCurrent) {
                      setSelectedNewFaculty(faculty.abbreviation);
                    }
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !isCurrent) {
                      event.preventDefault();
                      setSelectedNewFaculty(faculty.abbreviation);
                    }
                  }}
                >
                  <p className="faculty-grid-abbr">{faculty.abbreviation}</p>
                  <p className="faculty-grid-name">{faculty.name}</p>
                  {isCurrent ? <span className="current-badge">Curentă</span> : null}
                </div>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="button-cancel" id="modal-faculty-cancel" type="button" onClick={() => setShowFacultyModal(false)}>
              Anulează
            </button>
            <button
              className="button-confirm"
              id="modal-faculty-confirm"
              type="button"
              disabled={!selectedNewFaculty}
              onClick={handleConfirmFacultyChange}
            >
              Confirmă schimbarea
            </button>
          </div>
        </div>
      </div>

      <AppBottomNav active="" />
      <AppFooter />
    </div>
  );
}

export default Profil;
