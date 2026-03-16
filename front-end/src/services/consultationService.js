import api from "./axiosInstance";

export const getAllConsultations = (params) => api.get("/consultations", { params });

export const getConsultationById = (id) => api.get(`/consultations/${id}`);

export const getStudentConsultations = () => api.get("/consultations/student/my");

export const enrollConsultation = (consultationId) =>
  api.post("/consultations/student/enroll", { consultationId });

export const unenrollConsultation = (id) =>
  api.delete(`/consultations/student/unenroll/${id}`);

export const getMyConsultations = () => api.get("/consultations/professor/my");

export const createConsultation = (data) => api.post("/consultations/create", data);

export const updateConsultation = (id, data) =>
  api.put(`/consultations/update/${id}`, data);

export const cancelConsultation = (id, reason) =>
  api.put(`/consultations/cancel/${id}`, { cancellationReason: reason });

export const completeConsultation = (id) => api.put(`/consultations/complete/${id}`);

export const deleteConsultation = (id) => api.delete(`/consultations/delete/${id}`);
