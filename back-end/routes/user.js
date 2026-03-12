const router = require("express").Router();
const { getCurrentUser, completeProfile, updateProfile } = require("../controllers/user");
const { isAuthenticated } = require("../middleware/auth");

// GET /api/user/me — datele utilizatorului autentificat
router.get("/me", getCurrentUser);

// PUT /api/user/complete-profile — completarea profilului (onboarding)
router.put("/complete-profile", isAuthenticated, completeProfile);

// PUT /api/user/update-profile — actualizare profil
router.put("/update-profile", isAuthenticated, updateProfile);

module.exports = router;
