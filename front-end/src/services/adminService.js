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
export const createCourse = (data) => api.post("/admin/courses", data);
export const updateCourse = (id, data) => api.put(`/admin/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`);

// Professor Courses
export const assignCourse = (professorId, courseId) =>
  api.post(`/admin/professors/${professorId}/courses`, { courseId });
export const removeCourse = (professorId, courseId) =>
  api.delete(`/admin/professors/${professorId}/courses`, { data: { courseId } });

// Settings
export const getSettings = () => api.get("/admin/settings");
export const updateSession = (data) => api.put("/admin/settings/session", data);
