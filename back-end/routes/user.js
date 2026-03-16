const router = require("express").Router();
const { getCurrentUser, completeProfile, updateProfile, toggleEmailNotifications } = require("../controllers/user");
const { isAuthenticated } = require("../middleware/auth");

// GET /api/user/me — datele utilizatorului autentificat
router.get("/me", getCurrentUser);

// PUT /api/user/complete-profile — completarea profilului (onboarding)
router.put("/complete-profile", isAuthenticated, completeProfile);

// PUT /api/user/update-profile — actualizare profil
router.put("/update-profile", isAuthenticated, updateProfile);

// PUT /api/user/email-notifications — toggle notificări email
router.put("/email-notifications", isAuthenticated, toggleEmailNotifications);

module.exports = router;
