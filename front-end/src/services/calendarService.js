import api from "./axiosInstance";

export const getCalendarStatus = () => api.get("/google-calendar/status");

export const disconnectCalendar = () => api.post("/google-calendar/disconnect");

export const syncCalendar = () => api.post("/google-calendar/sync");
