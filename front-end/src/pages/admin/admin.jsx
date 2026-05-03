import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, authApi, courseApi } from '../../api';
import { useAuth } from '../../context/useAuth';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import { getRoleLabel } from '../../utils/navigation';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/section.css';
import '../../css/components/forms.css';
import '../../css/components/modal.css';
import '../student/student.css';
import './styles.css';

const ADMIN_TABS = [
  { key: 'users', icon: 'fa-solid fa-users', label: 'Utilizatori' },
  { key: 'faculties', icon: 'fa-solid fa-building-columns', label: 'Facultati' },
  { key: 'specializations', icon: 'fa-solid fa-sitemap', label: 'Specializari' },
  { key: 'courses', icon: 'fa-solid fa-book', label: 'Materii' },
  { key: 'professors', icon: 'fa-solid fa-chalkboard-user', label: 'Profesori' },
  { key: 'consultations', icon: 'fa-regular fa-calendar-check', label: 'Consultatii' },
  { key: 'settings', icon: 'fa-solid fa-gear', label: 'Setari' },
];

const USERS_PAGE_SIZE = 12;
const PROFESSORS_PAGE_SIZE = 8;
const CONSULTATIONS_PAGE_SIZE = 10;
const COURSES_PAGE_SIZE = 12;

const EMPTY_MODAL = { open: false, type: '', mode: 'create', values: {}, entityId: null };

function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [activeSession, setActiveSession] = useState('winter');
  const [seasonalTheme, setSeasonalTheme] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [assignments, setAssignments] = useState({});

  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [consultationSearch, setConsultationSearch] = useState('');
  const [professorSearch, setProfessorSearch] = useState('');
  const [specializationFacultyFilter, setSpecializationFacultyFilter] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [professorPage, setProfessorPage] = useState(1);
  const [consultationPage, setConsultationPage] = useState(1);

  const [modal, setModal] = useState(EMPTY_MODAL);
  const [modalErrors, setModalErrors] = useState({});
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [
        usersData,
        facultiesData,
        specializationsData,
        coursesData,
        consultationsData,
        settingsData,
      ] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getFaculties(),
        adminApi.getSpecializations(),
        adminApi.getCourses(),
        adminApi.getConsultations(),
        adminApi.getSettings(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setFaculties(Array.isArray(facultiesData) ? facultiesData : []);
      setSpecializations(Array.isArray(specializationsData) ? specializationsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
      setActiveSession(settingsData?.session?.activeSession || 'winter');
      setSeasonalTheme(settingsData?.session?.seasonalTheme !== false);

      const assignmentMap = {};
      await Promise.all(
        (Array.isArray(coursesData) ? coursesData : []).map(async (course) => {
          try {
            const details = await courseApi.getCourseById(course.id);
            (details?.professors || []).forEach((professor) => {
              const id = Number(professor.id);
              if (!assignmentMap[id]) assignmentMap[id] = [];
              if (!assignmentMap[id].includes(course.id)) assignmentMap[id].push(course.id);
            });
          } catch {
            // Ignore per-course assignment errors so the rest of the page still loads.
          }
        }),
      );

      setAssignments(assignmentMap);
    } catch (loadError) {
      setError(loadError?.message || 'Nu am putut incarca datele de administrare.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const professors = useMemo(
    () => users.filter((entry) => entry.role === 'professor' || entry.role === 'profesor'),
    [users],
  );

  const filteredProfessors = useMemo(() => {
    const query = professorSearch.trim().toLowerCase();
    if (!query) return professors;
    return professors.filter((entry) => {
      const fullName = `${entry.firstName || ''} ${entry.lastName || ''}`.toLowerCase();
      return fullName.includes(query) || (entry.email || '').toLowerCase().includes(query);
    });
  }, [professors, professorSearch]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((entry) => {
      const fullName = `${entry.firstName || ''} ${entry.lastName || ''}`.toLowerCase();
      return fullName.includes(query) || (entry.email || '').toLowerCase().includes(query);
    });
  }, [users, userSearch]);

  const filteredConsultations = useMemo(() => {
    const query = consultationSearch.trim().toLowerCase();
    if (!query) return consultations;

    return consultations.filter((entry) => {
      const courseName = entry.course?.name?.toLowerCase() || '';
      const professorName = `${entry.professor?.firstName || ''} ${entry.professor?.lastName || ''}`.toLowerCase();
      const dateText = `${entry.date || ''} ${(entry.time || '').slice(0, 5)}`.toLowerCase();
      return courseName.includes(query) || professorName.includes(query) || dateText.includes(query);
    });
  }, [consultations, consultationSearch]);

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((entry) => {
      const courseName = entry.name?.toLowerCase() || '';
      const specializationName = entry.specialization?.name?.toLowerCase() || '';
      const facultyAbbreviation = entry.faculty?.abbreviation?.toLowerCase() || '';
      const facultyName = entry.faculty?.name?.toLowerCase() || '';
      const yearText = String(entry.studyYear || '');

      return courseName.includes(query)
        || specializationName.includes(query)
        || facultyAbbreviation.includes(query)
        || facultyName.includes(query)
        || yearText.includes(query);
    });
  }, [courseSearch, courses]);

  const filteredSpecializations = useMemo(() => {
    if (!specializationFacultyFilter) {
      return specializations;
    }

    const facultyId = Number(specializationFacultyFilter);
    return specializations.filter((entry) => Number(entry.facultyId) === facultyId);
  }, [specializationFacultyFilter, specializations]);

  const filteredAssignmentCourses = useMemo(() => {
    const query = assignmentSearch.trim().toLowerCase();
    if (!query) {
      return courses;
    }

    return courses.filter((entry) => {
      const name = (entry.name || '').toLowerCase();
      const specialization = (entry.specialization?.name || '').toLowerCase();
      const faculty = (entry.faculty?.abbreviation || '').toLowerCase();
      const year = String(entry.studyYear || '');

      return name.includes(query)
        || specialization.includes(query)
        || faculty.includes(query)
        || year.includes(query);
    });
  }, [assignmentSearch, courses]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
  const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PAGE_SIZE));
  const totalProfessorPages = Math.max(1, Math.ceil(filteredProfessors.length / PROFESSORS_PAGE_SIZE));
  const totalConsultationPages = Math.max(1, Math.ceil(filteredConsultations.length / CONSULTATIONS_PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * USERS_PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  const paginatedCourses = useMemo(() => {
    const startIndex = (coursePage - 1) * COURSES_PAGE_SIZE;
    return filteredCourses.slice(startIndex, startIndex + COURSES_PAGE_SIZE);
  }, [coursePage, filteredCourses]);

  const paginatedProfessors = useMemo(() => {
    const startIndex = (professorPage - 1) * PROFESSORS_PAGE_SIZE;
    return filteredProfessors.slice(startIndex, startIndex + PROFESSORS_PAGE_SIZE);
  }, [professorPage, professors]);

  const paginatedConsultations = useMemo(() => {
    const startIndex = (consultationPage - 1) * CONSULTATIONS_PAGE_SIZE;
    return filteredConsultations.slice(startIndex, startIndex + CONSULTATIONS_PAGE_SIZE);
  }, [consultationPage, filteredConsultations]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, users.length]);

  useEffect(() => {
    setCoursePage(1);
  }, [courseSearch, courses.length]);

  useEffect(() => {
    setProfessorPage(1);
  }, [users.length]);

  useEffect(() => {
    setConsultationPage(1);
  }, [consultationSearch, consultations.length]);

  useEffect(() => {
    if (userPage > totalUserPages) {
      setUserPage(totalUserPages);
    }
  }, [totalUserPages, userPage]);

  useEffect(() => {
    if (coursePage > totalCoursePages) {
      setCoursePage(totalCoursePages);
    }
  }, [coursePage, totalCoursePages]);

  useEffect(() => {
    if (professorPage > totalProfessorPages) {
      setProfessorPage(totalProfessorPages);
    }
  }, [professorPage, totalProfessorPages]);

  useEffect(() => {
    if (consultationPage > totalConsultationPages) {
      setConsultationPage(totalConsultationPages);
    }
  }, [consultationPage, totalConsultationPages]);

  const openModal = (type, mode = 'create', values = {}, entityId = null) => {
    setModal({ open: true, type, mode, values, entityId });
    setModalErrors({});
  };

  const closeModal = () => {
    setModal(EMPTY_MODAL);
    setModalErrors({});
    setAssignmentSearch('');
  };

  const onModalFieldChange = (field, value) => {
    setModal((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value,
      },
    }));

    setModalErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateModal = () => {
    const values = modal.values || {};
    const nextErrors = {};

    if (modal.type === 'user') {
      if (modal.mode === 'create') {
        if (!values.firstName?.trim()) nextErrors.firstName = 'Prenumele este obligatoriu.';
        if (!values.lastName?.trim()) nextErrors.lastName = 'Numele este obligatoriu.';
        if (!values.email?.trim()) nextErrors.email = 'Email-ul este obligatoriu.';
      }
      if (!['student', 'professor', 'admin'].includes(values.role)) {
        nextErrors.role = 'Rol invalid.';
      }
    }

    if (modal.type === 'faculty') {
      if (!values.abbreviation?.trim()) nextErrors.abbreviation = 'Abrevierea este obligatorie.';
      if (!values.name?.trim()) nextErrors.name = 'Denumirea este obligatorie.';
    }

    if (modal.type === 'specialization') {
      if (!values.name?.trim()) nextErrors.name = 'Denumirea este obligatorie.';
      if (!values.facultyId) nextErrors.facultyId = 'Selecteaza facultatea.';
    }

    if (modal.type === 'course') {
      if (!values.name?.trim()) nextErrors.name = 'Numele materiei este obligatoriu.';
      if (!values.facultyId) nextErrors.facultyId = 'Selecteaza facultatea.';
      if (!values.specializationId) nextErrors.specializationId = 'Selecteaza specializarea.';
      const studyYear = Number(values.studyYear);
      if (!Number.isInteger(studyYear) || studyYear < 1 || studyYear > 6) {
        nextErrors.studyYear = 'Anul trebuie sa fie intre 1 si 6.';
      }
    }

    if (modal.type === 'consultation') {
      if (!values.professorId) nextErrors.professorId = 'Selecteaza profesorul.';
      if (!values.courseId) nextErrors.courseId = 'Selecteaza materia.';
      if (!values.date) nextErrors.date = 'Data este obligatorie.';
      if (!values.time) nextErrors.time = 'Ora este obligatorie.';

      const duration = Number(values.duration);
      if (!Number.isInteger(duration) || duration < 15) {
        nextErrors.duration = 'Durata minima este 15 minute.';
      }

      if (!['online', 'fizic'].includes(values.type)) {
        nextErrors.type = 'Tip invalid.';
      }

      if (values.type === 'online' && !values.meetingLink?.trim()) {
        nextErrors.meetingLink = 'Link-ul pentru sesiunea online este obligatoriu.';
      }

      if (values.type === 'fizic' && !values.room?.trim()) {
        nextErrors.room = 'Sala este obligatorie pentru consultatiile fizice.';
      }
    }

    return nextErrors;
  };

  const submitModal = async () => {
    const nextErrors = validateModal();
    if (Object.keys(nextErrors).length > 0) {
      setModalErrors(nextErrors);
      return;
    }

    setModalErrors({});
    setIsSubmittingModal(true);
    try {
      if (modal.type === 'user') {
        if (modal.mode === 'create') {
          await adminApi.createUser({
            email: modal.values.email,
            firstName: modal.values.firstName,
            lastName: modal.values.lastName,
            role: modal.values.role,
            facultyId: modal.values.facultyId ? Number(modal.values.facultyId) : null,
            specializationId: modal.values.specializationId ? Number(modal.values.specializationId) : null,
            studyYear: modal.values.studyYear ? Number(modal.values.studyYear) : null,
          });
        } else {
          await adminApi.updateUserRole(modal.entityId, modal.values.role);
        }
      }

      if (modal.type === 'faculty') {
        const payload = {
          name: modal.values.name,
          abbreviation: modal.values.abbreviation,
        };

        if (modal.mode === 'create') {
          await adminApi.createFaculty(payload);
        } else {
          await adminApi.updateFaculty(modal.entityId, payload);
        }
      }

      if (modal.type === 'specialization') {
        const payload = {
          name: modal.values.name,
          facultyId: Number(modal.values.facultyId),
        };

        if (modal.mode === 'create') {
          await adminApi.createSpecialization(payload);
        } else {
          await adminApi.updateSpecialization(modal.entityId, payload);
        }
      }

      if (modal.type === 'course') {
        const payload = {
          name: modal.values.name,
          facultyId: Number(modal.values.facultyId),
          specializationId: Number(modal.values.specializationId),
          studyYear: Number(modal.values.studyYear),
        };

        if (modal.mode === 'create') {
          await adminApi.createCourse(payload);
        } else {
          await adminApi.updateCourse(modal.entityId, payload);
        }
      }

      if (modal.type === 'consultation') {
        const payload = {
          professorId: Number(modal.values.professorId),
          courseId: Number(modal.values.courseId),
          date: modal.values.date,
          time: modal.values.time,
          duration: Number(modal.values.duration || 120),
          type: modal.values.type,
          room: modal.values.type === 'fizic' ? modal.values.room : null,
          meetingLink: modal.values.type === 'online' ? modal.values.meetingLink : null,
          serie: modal.values.serie || 'Toate',
        };

        if (modal.mode === 'create') {
          await adminApi.createConsultation(payload);
        } else {
          await adminApi.updateConsultation(modal.entityId, payload);
        }
      }

      if (modal.type === 'assignment') {
        const professorId = Number(modal.values.professorId);
        const current = assignments[professorId] || [];
        const target = modal.values.courseIds || [];

        const toAdd = target.filter((id) => !current.includes(id));
        const toRemove = current.filter((id) => !target.includes(id));

        await Promise.all([
          ...toAdd.map((courseId) => adminApi.assignCourse(professorId, courseId)),
          ...toRemove.map((courseId) => adminApi.unassignCourse(professorId, courseId)),
        ]);
      }

      closeModal();
      await loadData();
    } catch (submitError) {
      setError(submitError?.message || 'Operatiunea nu a putut fi finalizata.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRequest) return;

    try {
      if (deleteRequest.type === 'user') await adminApi.deleteUser(deleteRequest.id);
      if (deleteRequest.type === 'faculty') await adminApi.deleteFaculty(deleteRequest.id);
      if (deleteRequest.type === 'specialization') await adminApi.deleteSpecialization(deleteRequest.id);
      if (deleteRequest.type === 'course') await adminApi.deleteCourse(deleteRequest.id);
      if (deleteRequest.type === 'consultation') await adminApi.deleteConsultation(deleteRequest.id);

      setDeleteRequest(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError?.message || 'Stergerea a esuat.');
    }
  };

  const openAssignmentModal = (professorId) => {
    setAssignmentSearch('');
    openModal(
      'assignment',
      'edit',
      {
        professorId,
        courseIds: [...(assignments[professorId] || [])],
      },
      professorId,
    );
  };

  const patchConsultationStatus = (consultationId, status) => {
    setConsultations((current) =>
      current.map((entry) =>
        entry.id === consultationId
          ? {
            ...entry,
            status,
          }
          : entry,
      ),
    );
  };

  return (
    <div className="has-navbar app-background">
      <AppNavbar active="student" />

      <div className="dashboard-container">
        {error ? <p className="error-text">{error}</p> : null}
        {isLoading ? <p className="empty-state">Se incarca datele...</p> : null}

        <div className="admin-tabs" role="tablist">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-tab-content" hidden={activeTab !== 'users'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center">
              <h3>Utilizatori</h3>
              <button
                className="button-edit button-wide"
                type="button"
                onClick={() =>
                  openModal('user', 'create', {
                    firstName: '',
                    lastName: '',
                    email: '',
                    role: 'student',
                    facultyId: faculties[0]?.id || '',
                    specializationId: '',
                    studyYear: '',
                  })
                }
              >
                <i className="fa-solid fa-plus" />
                <span>Adauga</span>
              </button>
            </div>
            <div className="courses-filters">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="users-search">Cauta</label>
                <input
                  id="users-search"
                  type="text"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nume sau email"
                />
              </div>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nume</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((entry) => (
                    <tr key={entry.id}>
                      <td>{`${entry.firstName || ''} ${entry.lastName || ''}`.trim() || '-'}</td>
                      <td>{entry.email}</td>
                      <td>{getRoleLabel(entry.role)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-row-edit"
                            type="button"
                            onClick={() => openModal('user', 'edit', { role: entry.role }, entry.id)}
                          >
                            Modifică rol
                          </button>
                          <button
                            className="btn-row-delete"
                            type="button"
                            onClick={() => setDeleteRequest({ type: 'user', id: entry.id, label: entry.email })}
                          >
                            Sterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalUserPages > 1 ? (
              <div className="pagination" aria-label="Paginare utilizatori">
                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setUserPage((current) => Math.max(1, current - 1))}
                  disabled={userPage === 1}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                {Array.from({ length: totalUserPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`button-pagination ${userPage === page ? 'active' : ''}`}
                      type="button"
                      onClick={() => setUserPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setUserPage((current) => Math.min(totalUserPages, current + 1))}
                  disabled={userPage === totalUserPages}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-tab-content tab-faculties" hidden={activeTab !== 'faculties'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center">
              <h3>Facultati</h3>
              <button className="button-edit button-wide" type="button" onClick={() => openModal('faculty')}>
                <i className="fa-solid fa-plus" />
                <span>Adauga</span>
              </button>
            </div>
            <div className="admin-items-grid">
              {faculties.map((entry) => (
                <article className="admin-item-card" key={entry.id}>
                  <div className="admin-item-info">
                    <p className="admin-item-name">{entry.abbreviation}</p>
                    <p className="admin-item-sub">{entry.name}</p>
                  </div>
                  <div className="admin-item-actions">
                    <button className="btn-row-edit" type="button" onClick={() => openModal('faculty', 'edit', entry, entry.id)}>
                      Editeaza
                    </button>
                    <button className="btn-row-delete" type="button" onClick={() => setDeleteRequest({ type: 'faculty', id: entry.id, label: entry.name })}>
                      Sterge
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-tab-content tab-specializations" hidden={activeTab !== 'specializations'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center">
              <h3>Specializari</h3>
              <button
                className="button-edit button-wide"
                type="button"
                onClick={() => openModal('specialization', 'create', { name: '', facultyId: faculties[0]?.id || '' })}
              >
                <i className="fa-solid fa-plus" />
                <span>Adauga</span>
              </button>
            </div>

            <div className="courses-filters">
              <div className="form-group" style={{ minWidth: '240px' }}>
                <label htmlFor="specializations-faculty-filter">Facultate</label>
                <select
                  id="specializations-faculty-filter"
                  value={specializationFacultyFilter}
                  onChange={(event) => setSpecializationFacultyFilter(event.target.value)}
                >
                  <option value="">Toate facultatile</option>
                  {faculties.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.abbreviation} - {entry.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-items-grid">
              {filteredSpecializations.map((entry) => (
                <article className="admin-item-card" key={entry.id}>
                  <div className="admin-item-info">
                    <p className="admin-item-name">{entry.name}</p>
                    <p className="admin-item-sub">{entry.faculty?.abbreviation || '-'}</p>
                  </div>
                  <div className="admin-item-actions">
                    <button className="btn-row-edit" type="button" onClick={() => openModal('specialization', 'edit', entry, entry.id)}>
                      Editeaza
                    </button>
                    <button className="btn-row-delete" type="button" onClick={() => setDeleteRequest({ type: 'specialization', id: entry.id, label: entry.name })}>
                      Sterge
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-tab-content tab-courses" hidden={activeTab !== 'courses'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center">
              <h3>Materii</h3>
              <button
                className="button-edit button-wide"
                type="button"
                onClick={() =>
                  openModal('course', 'create', {
                    name: '',
                    facultyId: faculties[0]?.id || '',
                    specializationId: specializations[0]?.id || '',
                    studyYear: 1,
                  })
                }
              >
                <i className="fa-solid fa-plus" />
                <span>Adauga</span>
              </button>
            </div>

            <div className="courses-filters">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="courses-search">Cauta</label>
                <input
                  id="courses-search"
                  type="text"
                  value={courseSearch}
                  onChange={(event) => setCourseSearch(event.target.value)}
                  placeholder="Materie, facultate, specializare sau an"
                />
              </div>
            </div>

            <div className="admin-items-grid admin-items-grid-courses">
              {paginatedCourses.map((entry) => (
                <article className="admin-item-card" key={entry.id}>
                  <div className="admin-item-info">
                    <p className="admin-item-name">{entry.name}</p>
                    <p className="admin-item-sub">An {entry.studyYear} - {entry.specialization?.name || 'fara specializare'}</p>
                  </div>
                  <div className="admin-item-actions">
                    <button className="btn-row-edit" type="button" onClick={() => openModal('course', 'edit', entry, entry.id)}>
                      Editeaza
                    </button>
                    <button className="btn-row-delete" type="button" onClick={() => setDeleteRequest({ type: 'course', id: entry.id, label: entry.name })}>
                      Sterge
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {totalCoursePages > 1 ? (
              <div className="pagination" aria-label="Paginare materii">
                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setCoursePage((current) => Math.max(1, current - 1))}
                  disabled={coursePage === 1}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                {Array.from({ length: totalCoursePages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`button-pagination ${coursePage === page ? 'active' : ''}`}
                      type="button"
                      onClick={() => setCoursePage(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setCoursePage((current) => Math.min(totalCoursePages, current + 1))}
                  disabled={coursePage === totalCoursePages}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-tab-content" hidden={activeTab !== 'professors'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center">
              <h3>Asignari profesori</h3>
            </div>
            <div className="courses-filters">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="professor-search">Cauta</label>
                <input
                  id="professor-search"
                  type="text"
                  value={professorSearch}
                  onChange={(e) => { setProfessorSearch(e.target.value); setProfessorPage(1); }}
                  placeholder="Nume sau email"
                />
              </div>
            </div>
            {paginatedProfessors.map((entry) => (
              <article className="prof-assign-card" key={entry.id}>
                <div>
                  <p className="prof-assign-name">{`${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.email}</p>
                  <p className="prof-assign-courses">
                    {(assignments[entry.id] || [])
                      .map((courseId) => courses.find((course) => course.id === courseId)?.name)
                      .filter(Boolean)
                      .join(', ') || 'Fara materii alocate'}
                  </p>
                </div>
                <div className="prof-card-actions">
                  <button className="btn-row-edit" type="button" onClick={() => openAssignmentModal(entry.id)}>
                    Gestioneaza
                  </button>
                </div>
              </article>
            ))}
            {totalProfessorPages > 1 ? (
              <div className="pagination" aria-label="Paginare profesori">
                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setProfessorPage((current) => Math.max(1, current - 1))}
                  disabled={professorPage === 1}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                {Array.from({ length: totalProfessorPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`button-pagination ${professorPage === page ? 'active' : ''}`}
                      type="button"
                      onClick={() => setProfessorPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setProfessorPage((current) => Math.min(totalProfessorPages, current + 1))}
                  disabled={professorPage === totalProfessorPages}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-tab-content" hidden={activeTab !== 'consultations'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center">
              <h3>Consultatii</h3>
              <button
                className="button-edit button-wide"
                type="button"
                onClick={() =>
                  openModal('consultation', 'create', {
                    professorId: professors[0]?.id || '',
                    courseId: courses[0]?.id || '',
                    date: '',
                    time: '',
                    duration: 120,
                    type: 'online',
                    room: '',
                    meetingLink: '',
                    serie: 'Toate',
                  })
                }
              >
                <i className="fa-solid fa-plus" />
                <span>Adauga</span>
              </button>
            </div>

            <div className="courses-filters">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="consultations-search">Cauta</label>
                <input
                  id="consultations-search"
                  type="text"
                  value={consultationSearch}
                  onChange={(event) => setConsultationSearch(event.target.value)}
                  placeholder="Materie, profesor sau data"
                />
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Materie</th>
                    <th>Profesor</th>
                    <th>Data</th>
                    <th>Tip</th>
                    <th>Status</th>
                    <th>Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConsultations.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.course?.name || '-'}</td>
                      <td>{`${entry.professor?.firstName || ''} ${entry.professor?.lastName || ''}`.trim() || '-'}</td>
                      <td>{`${entry.date || '-'} ${(entry.time || '').slice(0, 5)}`}</td>
                      <td>{entry.type}</td>
                      <td>{entry.status}</td>
                      <td>
                        <div className="table-actions">
                          {entry.status !== 'cancelled' && entry.status !== 'completed' ? (
                            <button
                              className="btn-row-edit"
                              type="button"
                              onClick={() =>
                                openModal(
                                  'consultation',
                                  'edit',
                                  {
                                    professorId: entry.professorId,
                                    courseId: entry.courseId,
                                    date: entry.date || '',
                                    time: (entry.time || '').slice(0, 5),
                                    duration: entry.duration || 120,
                                    type: entry.type || 'online',
                                    room: entry.room || '',
                                    meetingLink: entry.meetingLink || '',
                                    serie: entry.serie || 'Toate',
                                  },
                                  entry.id,
                                )
                              }
                            >
                              Editeaza
                            </button>
                          ) : null}
                          {entry.status === 'published' ? (
                            <button
                              className="btn-row-edit btn-row-cancel"
                              type="button"
                              onClick={async () => {
                                await adminApi.cancelConsultation(entry.id, 'Anulata de admin');
                                patchConsultationStatus(entry.id, 'cancelled');
                              }}
                            >
                              Anuleaza
                            </button>
                          ) : null}
                          {entry.status === 'cancelled' ? (
                            <button
                              className="btn-row-edit btn-row-reactivate"
                              type="button"
                              onClick={async () => {
                                await adminApi.reactivateConsultation(entry.id);
                                patchConsultationStatus(entry.id, 'published');
                              }}
                            >
                              Re-activeaza
                            </button>
                          ) : null}
                          <button
                            className="btn-row-delete"
                            type="button"
                            onClick={() => setDeleteRequest({ type: 'consultation', id: entry.id, label: entry.course?.name || `#${entry.id}` })}
                          >
                            Sterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalConsultationPages > 1 ? (
              <div className="pagination" aria-label="Paginare consultatii">
                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setConsultationPage((current) => Math.max(1, current - 1))}
                  disabled={consultationPage === 1}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                {Array.from({ length: totalConsultationPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`button-pagination ${consultationPage === page ? 'active' : ''}`}
                      type="button"
                      onClick={() => setConsultationPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="button-pagination"
                  type="button"
                  onClick={() => setConsultationPage((current) => Math.min(totalConsultationPages, current + 1))}
                  disabled={consultationPage === totalConsultationPages}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-tab-content" hidden={activeTab !== 'settings'}>
          <div className="dashboard-section">
            <div className="section-header section-header-col section-header-center" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Sesiune academica activa</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-inverse)' }}>
                <span>Design sezonier</span>
                <span
                  role="switch"
                  aria-checked={seasonalTheme}
                  onClick={async () => {
                    const next = !seasonalTheme;
                    try {
                      await adminApi.updateSeasonalTheme(next);
                      setSeasonalTheme(next);
                      document.body.classList.remove('season-winter', 'season-summer');
                      if (next) document.body.classList.add(`season-${activeSession}`);
                    } catch { setSessionError('Eroare la actualizarea temei.'); }
                  }}
                  style={{
                    display: 'inline-block', width: '2.4rem', height: '1.35rem',
                    borderRadius: '999px', background: seasonalTheme ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.25s ease', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '50%', transform: `translateY(-50%) translateX(${seasonalTheme ? '1.1rem' : '0.15rem'})`,
                    width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                    transition: 'transform 0.25s ease', display: 'block',
                  }} />
                </span>
              </label>
            </div>
            <div className="session-toggle-group">
              <button
                type="button"
                className={`session-toggle-btn ${activeSession === 'winter' ? 'active' : ''}`}
                onClick={async () => {
                  setSessionError('');
                  try {
                    await adminApi.updateSession('winter');
                    setActiveSession('winter');
                    if (seasonalTheme) {
                      document.body.classList.remove('season-winter', 'season-summer');
                      document.body.classList.add('season-winter');
                    }
                  } catch (err) {
                    setSessionError(err?.message || 'Eroare la schimbarea sesiunii.');
                  }
                }}
              >
                <i className="fa-solid fa-snowflake" />
                <span>Iarna</span>
                <small>Ianuarie - Februarie</small>
              </button>
              <button
                type="button"
                className={`session-toggle-btn ${activeSession === 'summer' ? 'active' : ''}`}
                onClick={async () => {
                  setSessionError('');
                  try {
                    await adminApi.updateSession('summer');
                    setActiveSession('summer');
                    if (seasonalTheme) {
                      document.body.classList.remove('season-winter', 'season-summer');
                      document.body.classList.add('season-summer');
                    }
                  } catch (err) {
                    setSessionError(err?.message || 'Eroare la schimbarea sesiunii.');
                  }
                }}
              >
                <i className="fa-solid fa-sun" />
                <span>Vara</span>
                <small>Iunie - Iulie</small>
              </button>
            </div>
            {sessionError ? <p className="error-text" style={{ marginTop: '0.75rem' }}>{sessionError}</p> : null}
          </div>

          <div className="dashboard-section" style={{ marginTop: '1.5rem' }}>
            <div className="section-header section-header-col section-header-center">
              <h3>Acces Google Drive</h3>
              <p className="section-subtitle">
                {user?.hasDriveAccess
                  ? 'Drive-ul este conectat. Poți încărca și șterge fișiere.'
                  : 'Conectează-ți contul Google cu acces Drive pentru a putea încărca și șterge fișiere.'}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href={authApi.googleAdminLoginUrl()}
                className="session-toggle-btn"
                style={{ textDecoration: 'none', gap: '0.5rem' }}
              >
                <i className="fa-brands fa-google" />
                <span>{user?.hasDriveAccess ? 'Reconectează Drive' : 'Conectează Drive'}</span>
              </a>
              {user?.hasDriveAccess ? (
                <button
                  type="button"
                  className="session-toggle-btn"
                  onClick={async () => {
                    try {
                      const result = await adminApi.syncDriveFolders();
                      alert(`Sync finalizat: ${result.updated} consultații actualizate${result.failedCount ? `, ${result.failedCount} eșuate` : ''}.`);
                    } catch (err) {
                      alert(err?.message || 'Eroare la sincronizare.');
                    }
                  }}
                >
                  <i className="fa-solid fa-rotate" />
                  <span>Sincronizează foldere</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-overlay" hidden={!modal.open} onClick={closeModal}>
        <div
          className={`modal-card ${modal.type === 'assignment' ? 'modal-card-assignment' : modal.mode === 'edit' ? 'modal-card-wide' : 'modal-card-create'}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{modal.mode === 'edit' ? 'Editeaza' : 'Adauga'}</h3>
            <button className="modal-close" type="button" onClick={closeModal}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-form-body">
            {modal.type === 'user' && modal.mode === 'create' ? (
              <>
                <div className="form-group"><label>Prenume</label><input value={modal.values.firstName || ''} onChange={(event) => onModalFieldChange('firstName', event.target.value)} />{modalErrors.firstName ? <small className="error-text">{modalErrors.firstName}</small> : null}</div>
                <div className="form-group"><label>Nume</label><input value={modal.values.lastName || ''} onChange={(event) => onModalFieldChange('lastName', event.target.value)} />{modalErrors.lastName ? <small className="error-text">{modalErrors.lastName}</small> : null}</div>
                <div className="form-group"><label>Email</label><input type="email" value={modal.values.email || ''} onChange={(event) => onModalFieldChange('email', event.target.value)} />{modalErrors.email ? <small className="error-text">{modalErrors.email}</small> : null}</div>
                <div className="form-group"><label>Rol</label><select value={modal.values.role || 'student'} onChange={(event) => onModalFieldChange('role', event.target.value)}><option value="student">student</option><option value="professor">profesor</option><option value="admin">admin</option></select>{modalErrors.role ? <small className="error-text">{modalErrors.role}</small> : null}</div>
                <div className="form-group"><label>Facultate</label><select value={modal.values.facultyId || ''} onChange={(event) => onModalFieldChange('facultyId', event.target.value)}><option value="">-</option>{faculties.map((entry) => <option key={entry.id} value={entry.id}>{entry.abbreviation}</option>)}</select></div>
                <div className="form-group"><label>Specializare</label><select value={modal.values.specializationId || ''} onChange={(event) => onModalFieldChange('specializationId', event.target.value)}><option value="">-</option>{specializations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></div>
                <div className="form-group"><label>An studiu</label><input type="number" min="1" max="6" value={modal.values.studyYear || ''} onChange={(event) => onModalFieldChange('studyYear', event.target.value)} /></div>
              </>
            ) : null}

            {modal.type === 'user' && modal.mode === 'edit' ? (
              <div className="form-group"><label>Rol</label><select value={modal.values.role || 'student'} onChange={(event) => onModalFieldChange('role', event.target.value)}><option value="student">student</option><option value="professor">profesor</option><option value="admin">admin</option></select>{modalErrors.role ? <small className="error-text">{modalErrors.role}</small> : null}</div>
            ) : null}

            {modal.type === 'faculty' ? (
              <>
                <div className="form-group"><label>Abreviere</label><input value={modal.values.abbreviation || ''} onChange={(event) => onModalFieldChange('abbreviation', event.target.value)} />{modalErrors.abbreviation ? <small className="error-text">{modalErrors.abbreviation}</small> : null}</div>
                <div className="form-group"><label>Denumire</label><input value={modal.values.name || ''} onChange={(event) => onModalFieldChange('name', event.target.value)} />{modalErrors.name ? <small className="error-text">{modalErrors.name}</small> : null}</div>
              </>
            ) : null}

            {modal.type === 'specialization' ? (
              <>
                <div className="form-group"><label>Denumire</label><input value={modal.values.name || ''} onChange={(event) => onModalFieldChange('name', event.target.value)} />{modalErrors.name ? <small className="error-text">{modalErrors.name}</small> : null}</div>
                <div className="form-group"><label>Facultate</label><select value={modal.values.facultyId || ''} onChange={(event) => onModalFieldChange('facultyId', event.target.value)}>{faculties.map((entry) => <option key={entry.id} value={entry.id}>{entry.abbreviation}</option>)}</select>{modalErrors.facultyId ? <small className="error-text">{modalErrors.facultyId}</small> : null}</div>
              </>
            ) : null}

            {modal.type === 'course' ? (
              <>
                <div className="form-group"><label>Nume materie</label><input value={modal.values.name || ''} onChange={(event) => onModalFieldChange('name', event.target.value)} />{modalErrors.name ? <small className="error-text">{modalErrors.name}</small> : null}</div>
                <div className="form-group"><label>Facultate</label><select value={modal.values.facultyId || ''} onChange={(event) => onModalFieldChange('facultyId', event.target.value)}>{faculties.map((entry) => <option key={entry.id} value={entry.id}>{entry.abbreviation}</option>)}</select>{modalErrors.facultyId ? <small className="error-text">{modalErrors.facultyId}</small> : null}</div>
                <div className="form-group"><label>Specializare</label><select value={modal.values.specializationId || ''} onChange={(event) => onModalFieldChange('specializationId', event.target.value)}>{specializations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>{modalErrors.specializationId ? <small className="error-text">{modalErrors.specializationId}</small> : null}</div>
                <div className="form-group"><label>An studiu</label><input type="number" min="1" max="6" value={modal.values.studyYear || 1} onChange={(event) => onModalFieldChange('studyYear', event.target.value)} />{modalErrors.studyYear ? <small className="error-text">{modalErrors.studyYear}</small> : null}</div>
              </>
            ) : null}

            {modal.type === 'consultation' ? (
              <>
                <div className="form-group"><label>Profesor</label><select value={modal.values.professorId || ''} onChange={(event) => onModalFieldChange('professorId', event.target.value)}>{professors.map((entry) => <option key={entry.id} value={entry.id}>{`${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.email}</option>)}</select>{modalErrors.professorId ? <small className="error-text">{modalErrors.professorId}</small> : null}</div>
                <div className="form-group"><label>Materie</label><select value={modal.values.courseId || ''} onChange={(event) => onModalFieldChange('courseId', event.target.value)}>{courses.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>{modalErrors.courseId ? <small className="error-text">{modalErrors.courseId}</small> : null}</div>
                <div className="form-group"><label>Data</label><input type="date" value={modal.values.date || ''} onChange={(event) => onModalFieldChange('date', event.target.value)} />{modalErrors.date ? <small className="error-text">{modalErrors.date}</small> : null}</div>
                <div className="form-group"><label>Ora</label><input type="time" value={modal.values.time || ''} onChange={(event) => onModalFieldChange('time', event.target.value)} />{modalErrors.time ? <small className="error-text">{modalErrors.time}</small> : null}</div>
                <div className="form-group"><label>Durata (minute)</label><input type="number" min="15" step="15" value={modal.values.duration || 120} onChange={(event) => onModalFieldChange('duration', event.target.value)} />{modalErrors.duration ? <small className="error-text">{modalErrors.duration}</small> : null}</div>
                <div className="form-group"><label>Tip</label><select value={modal.values.type || 'online'} onChange={(event) => onModalFieldChange('type', event.target.value)}><option value="online">online</option><option value="fizic">fizic</option></select>{modalErrors.type ? <small className="error-text">{modalErrors.type}</small> : null}</div>
                {modal.values.type === 'online' ? <div className="form-group"><label>Link</label><input value={modal.values.meetingLink || ''} onChange={(event) => onModalFieldChange('meetingLink', event.target.value)} />{modalErrors.meetingLink ? <small className="error-text">{modalErrors.meetingLink}</small> : null}</div> : null}
                {modal.values.type === 'fizic' ? <div className="form-group"><label>Sala</label><input value={modal.values.room || ''} onChange={(event) => onModalFieldChange('room', event.target.value)} />{modalErrors.room ? <small className="error-text">{modalErrors.room}</small> : null}</div> : null}
                <div className="form-group"><label>Serie</label><input value={modal.values.serie || 'Toate'} onChange={(event) => onModalFieldChange('serie', event.target.value)} /></div>
              </>
            ) : null}

            {modal.type === 'assignment' ? (
              <>
                <div className="assign-search-wrapper">
                  <i className="fa-solid fa-magnifying-glass assign-search-icon" />
                  <input
                    className="assign-search-input"
                    type="text"
                    value={assignmentSearch}
                    onChange={(event) => setAssignmentSearch(event.target.value)}
                    placeholder="Cauta materie, specializare, facultate sau an"
                  />
                </div>
                <div className="assignment-courses-list">
                  {filteredAssignmentCourses.map((entry) => {
                  const selected = (modal.values.courseIds || []).includes(entry.id);
                  return (
                    <label key={entry.id} className="assignment-course-option">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const next = selected
                            ? (modal.values.courseIds || []).filter((id) => id !== entry.id)
                            : [...(modal.values.courseIds || []), entry.id];
                          onModalFieldChange('courseIds', next);
                        }}
                      />
                      <span>{entry.name}</span>
                    </label>
                  );
                  })}
                  {filteredAssignmentCourses.length === 0 ? (
                    <p className="empty-state">Nu exista materii pentru cautarea introdusa.</p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="button-cancel" onClick={closeModal}>Anuleaza</button>
            <button type="button" className="button-save" onClick={submitModal} disabled={isSubmittingModal}>{isSubmittingModal ? 'Se salveaza...' : 'Salveaza'}</button>
          </div>
        </div>
      </div>

      <div className="modal-overlay" hidden={!deleteRequest} onClick={() => setDeleteRequest(null)}>
        <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(event) => event.stopPropagation()}>
          <h3>Confirma stergerea</h3>
          <p style={{ marginBottom: '1rem' }}>Sigur vrei sa stergi: <strong>{deleteRequest?.label}</strong>?</p>
          <div className="modal-actions">
            <button type="button" className="button-cancel" onClick={() => setDeleteRequest(null)}>Anuleaza</button>
            <button type="button" className="button-delete" onClick={confirmDelete}>Sterge</button>
          </div>
        </div>
      </div>
      <AppBottomNav active="student" />
    </div>
  );
}

export default Admin;
