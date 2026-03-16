const router = require("express").Router();
const { connect, callback, getStatus, disconnect, syncAll } = require("../controllers/googleCalendar");
const { isAuthenticated, hasRole } = require("../middleware/auth");

// GET /api/google-calendar/connect — inițiază OAuth (student)
router.get("/connect", isAuthenticated, hasRole("student"), connect);

// GET /api/google-calendar/callback — callback OAuth
router.get("/callback", callback);

// GET /api/google-calendar/status — starea conexiunii (student)
router.get("/status", isAuthenticated, hasRole("student"), getStatus);

// POST /api/google-calendar/disconnect — deconectare (student)
router.post("/disconnect", isAuthenticated, hasRole("student"), disconnect);

// POST /api/google-calendar/sync — forțează re-sincronizarea (student)
router.post("/sync", isAuthenticated, hasRole("student"), syncAll);

module.exports = router;
