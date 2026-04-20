import { apiDelete, apiGet, apiPost, apiPut, apiRequest, getApiBaseUrl } from './client';

export const authApi = {
  getCurrentUser: () => apiGet('/user/me'),
  logout: () => apiGet('/auth/logout'),
  googleLoginUrl: () => `${getApiBaseUrl()}/auth/google`,
  googleAdminLoginUrl: () => `${getApiBaseUrl()}/auth/google/admin`,
};

export const consultationApi = {
  getPublicConsultations: () => apiGet('/consultations'),
  getStudentConsultations: () => apiGet('/consultations/student/my'),
  getProfessorConsultations: () => apiGet('/consultations/professor/my'),
  createConsultation: (payload) => apiPost('/consultations/create', payload),
  updateConsultation: (id, payload) => apiPut(`/consultations/update/${id}`, payload),
  cancelConsultation: (id, cancellationReason) =>
    apiPut(`/consultations/cancel/${id}`, { cancellationReason }),
  reactivateConsultation: (id) => apiPut(`/consultations/reactivate/${id}`),
  deleteConsultation: (id) => apiDelete(`/consultations/delete/${id}`),
  enroll: (consultationId) => apiPost('/consultations/student/enroll', { consultationId }),
  unenroll: (consultationId) => apiDelete(`/consultations/student/unenroll/${consultationId}`),
};

export const courseApi = {
  getAllCourses: () => apiGet('/courses'),
  getCourseById: (id) => apiGet(`/courses/${id}`),
  getMyCourses: () => apiGet('/courses/my'),
  assignMyCourse: (courseId) => apiPost('/courses/my/assign', { courseId }),
};

export const profileApi = {
  updateProfile: (payload) => apiPut('/user/update-profile', payload),
  updateEmailNotifications: (enabled) => apiPut('/user/email-notifications', { enabled }),
  getNotificationSettings: () => apiGet('/user/notification-settings'),
  updateNotificationSettings: (payload) => apiPut('/user/notification-settings', payload),
  getFaculties: () => apiGet('/faculties'),
  getSpecializations: (facultyId) => apiGet(`/specializations?facultyId=${facultyId}`),
};

export const googleCalendarApi = {
  getStatus: () => apiGet('/google-calendar/status'),
  connectUrl: () => `${getApiBaseUrl()}/google-calendar/connect`,
  disconnect: () => apiPost('/google-calendar/disconnect'),
  sync: () => apiPost('/google-calendar/sync'),
};

export const driveApi = {
  listFiles: ({ folderId, pageToken, pageSize, includeTotal, q } = {}) => {
    const params = new URLSearchParams();
    if (folderId) params.set('folderId', folderId);
    if (pageToken) params.set('pageToken', pageToken);
    if (pageSize) params.set('pageSize', String(pageSize));
    if (includeTotal) params.set('includeTotal', 'true');
    if (q) params.set('q', q);
    const query = params.toString();
    return apiGet(`/drive/files${query ? `?${query}` : ''}`);
  },
  downloadFolder: async (folderId) => {
    if (!folderId) {
      throw new Error('Lipsește folderId pentru descărcare.');
    }

    const params = new URLSearchParams({ folderId });
    const response = await fetch(`${getApiBaseUrl()}/drive/download-folder?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Nu am putut descărca folderul.';
      try {
        const payload = await response.json();
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // Ignore JSON parse errors for non-JSON responses.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const fileName = match?.[1] || 'folder.zip';

    return { blob, fileName };
  },
  uploadFile: (folderId, file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          const result = await apiPost('/drive/upload', {
            folderId,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64,
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Nu am putut citi fișierul.'));
      reader.readAsDataURL(file);
    }),
  deleteItem: (fileId) => apiDelete(`/drive/file/${fileId}`),
  createFolder: (parentId, name) => apiPost('/drive/folder', { parentId, name }),
  getProfessorFolderIds: () => apiGet('/drive/my-folder-ids'),
};

export const settingsApi = {
  getActiveSession: () => apiGet('/settings/session'),
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
  reactivateConsultation: (id) => apiPut(`/admin/consultations/reactivate/${id}`),

  getSettings: () => apiGet('/admin/settings'),
  updateSession: (activeSession) => apiPut('/admin/settings/session', { activeSession }),
  syncDriveFolders: () => apiPost('/consultations/admin/sync-drive-folders'),
};
