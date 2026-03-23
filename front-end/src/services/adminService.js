import api from "./axiosInstance";

// Users
export const getUsers = () => api.get("/admin/users");
export const createUser = (data) => api.post("/admin/users", data);
export const updateUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Faculties
export const getFaculties = () => api.get("/admin/faculties");
export const createFaculty = (data) => api.post("/admin/faculties", data);
export const updateFaculty = (id, data) => api.put(`/admin/faculties/${id}`, data);
export const deleteFaculty = (id) => api.delete(`/admin/faculties/${id}`);

// Specializations
export const getSpecializations = (facultyId) =>
  api.get("/admin/specializations", { params: facultyId ? { facultyId } : {} });
export const createSpecialization = (data) => api.post("/admin/specializations", data);
export const updateSpecialization = (id, data) =>
  api.put(`/admin/specializations/${id}`, data);
export const deleteSpecialization = (id) => api.delete(`/admin/specializations/${id}`);

// Courses
export const getCourses = () => api.get("/admin/courses");
export const createCourse = (data) => api.post("/admin/courses", data);
export const updateCourse = (id, data) => api.put(`/admin/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`);

// Professor Courses
export const assignCourse = (professorId, courseId) =>
  api.post(`/admin/professors/${professorId}/courses`, { courseId });
export const removeCourse = (professorId, courseId) =>
  api.delete(`/admin/professors/${professorId}/courses`, { data: { courseId } });

// Consultations (admin)
export const getAdminConsultations = () => api.get("/admin/consultations");
export const adminCreateConsultation = (data) => api.post("/admin/consultations", data);
export const adminCancelConsultation = (id) => api.put(`/admin/consultations/cancel/${id}`);
export const adminDeleteConsultation = (id) => api.delete(`/admin/consultations/${id}`);

// Settings
export const getSettings = () => api.get("/admin/settings");
export const updateSettings = (data) => api.put("/admin/settings/session", data);
export const updateSession = (data) => api.put("/admin/settings/session", data);
