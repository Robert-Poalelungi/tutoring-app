import { apiDelete, apiGet, apiPost, apiPut, apiRequest, getApiBaseUrl } from './client';

export const authApi = {
  getCurrentUser: () => apiGet('/user/me'),
  logout: () => apiGet('/auth/logout'),
  googleLoginUrl: () => `${getApiBaseUrl()}/auth/google`,
};

export const consultationApi = {
  getPublicConsultations: () => apiGet('/consultations'),
  getStudentConsultations: () => apiGet('/consultations/student/my'),
  getProfessorConsultations: () => apiGet('/consultations/professor/my'),
  createConsultation: (payload) => apiPost('/consultations/create', payload),
  updateConsultation: (id, payload) => apiPut(`/consultations/update/${id}`, payload),
  deleteConsultation: (id) => apiDelete(`/consultations/delete/${id}`),
  enroll: (consultationId) => apiPost('/consultations/student/enroll', { consultationId }),
  unenroll: (consultationId) => apiDelete(`/consultations/student/unenroll/${consultationId}`),
};

export const courseApi = {
  getAllCourses: () => apiGet('/courses'),
  getCourseById: (id) => apiGet(`/courses/${id}`),
  getMyCourses: () => apiGet('/courses/my'),
};

export const profileApi = {
  updateProfile: (payload) => apiPut('/user/update-profile', payload),
  getFaculties: () => apiGet('/faculties'),
  getSpecializations: (facultyId) => apiGet(`/specializations?facultyId=${facultyId}`),
};

export const googleCalendarApi = {
  getStatus: () => apiGet('/google-calendar/status'),
  connectUrl: () => `${getApiBaseUrl()}/google-calendar/connect`,
  disconnect: () => apiPost('/google-calendar/disconnect'),
  sync: () => apiPost('/google-calendar/sync'),
};

export const adminApi = {
  getUsers: () => apiGet('/admin/users'),
  createUser: (payload) => apiPost('/admin/users', payload),
  updateUserRole: (id, role) => apiPut(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => apiDelete(`/admin/users/${id}`),

  getFaculties: () => apiGet('/admin/faculties'),
  createFaculty: (payload) => apiPost('/admin/faculties', payload),
  updateFaculty: (id, payload) => apiPut(`/admin/faculties/${id}`, payload),
  deleteFaculty: (id) => apiDelete(`/admin/faculties/${id}`),

  getSpecializations: () => apiGet('/admin/specializations'),
  createSpecialization: (payload) => apiPost('/admin/specializations', payload),
  updateSpecialization: (id, payload) => apiPut(`/admin/specializations/${id}`, payload),
  deleteSpecialization: (id) => apiDelete(`/admin/specializations/${id}`),

  getCourses: () => apiGet('/admin/courses'),
  createCourse: (payload) => apiPost('/admin/courses', payload),
  updateCourse: (id, payload) => apiPut(`/admin/courses/${id}`, payload),
  deleteCourse: (id) => apiDelete(`/admin/courses/${id}`),

  assignCourse: (professorId, courseId) => apiPost(`/admin/professors/${professorId}/courses`, { courseId }),
  unassignCourse: (professorId, courseId) =>
    apiRequest(`/admin/professors/${professorId}/courses`, {
      method: 'DELETE',
      body: JSON.stringify({ courseId }),
    }),

  getConsultations: () => apiGet('/admin/consultations'),
  createConsultation: (payload) => apiPost('/admin/consultations', payload),
  updateConsultation: (id, payload) => apiPut(`/consultations/update/${id}`, payload),
  deleteConsultation: (id) => apiDelete(`/admin/consultations/${id}`),
  cancelConsultation: (id, cancellationReason) =>
    apiPut(`/admin/consultations/cancel/${id}`, { cancellationReason }),

  getSettings: () => apiGet('/admin/settings'),
  updateSession: (activeSession) => apiPut('/admin/settings/session', { activeSession }),
};
