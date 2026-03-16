const router = require("express").Router();
const { getAllFaculties } = require("../controllers/faculty");

// GET /api/faculties — toate facultățile (public)
router.get("/", getAllFaculties);

module.exports = router;
