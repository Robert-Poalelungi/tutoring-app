const router = require("express").Router();
const { getActiveSession } = require("../controllers/settings");

// GET /api/settings/session — sesiunea activă (public)
router.get("/session", getActiveSession);

module.exports = router;
