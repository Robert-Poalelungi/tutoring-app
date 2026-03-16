import api from "./axiosInstance";

export const completeProfile = (data) => api.put("/user/complete-profile", data);

export const updateProfile = (data) => api.put("/user/update-profile", data);

export const toggleEmailNotifications = (enabled) =>
  api.put("/user/email-notifications", { enabled });
