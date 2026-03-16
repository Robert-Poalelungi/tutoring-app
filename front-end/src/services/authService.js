import api from "./axiosInstance";

export const getCurrentUser = () => api.get("/user/me");

export const logout = () => api.get("/auth/logout");
