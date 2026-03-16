import api from "./axiosInstance";

export const getActiveSession = () => api.get("/settings/session");
