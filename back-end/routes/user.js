const router = require("express").Router();
const {
	getCurrentUser,
	completeProfile,
	updateProfile,
	toggleEmailNotifications,
	getNotificationSettings,
	updateNotificationSettings,
} = require("../controllers/user");
const { isAuthenticated } = require("../middleware/auth");

// GET /api/user/me — datele utilizatorului autentificat
router.get("/me", getCurrentUser);

// PUT /api/user/complete-profile — completarea profilului (onboarding)
router.put("/complete-profile", isAuthenticated, completeProfile);

// PUT /api/user/update-profile — actualizare profil
router.put("/update-profile", isAuthenticated, updateProfile);

// PUT /api/user/email-notifications — toggle notificări email
router.put("/email-notifications", isAuthenticated, toggleEmailNotifications);

// GET /api/user/notification-settings — tipuri de notificări email
router.get("/notification-settings", isAuthenticated, getNotificationSettings);

// PUT /api/user/notification-settings — actualizare tipuri notificări email
router.put("/notification-settings", isAuthenticated, updateNotificationSettings);

module.exports = router;
