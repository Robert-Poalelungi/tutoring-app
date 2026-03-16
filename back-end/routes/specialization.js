const router = require("express").Router();
const { getAllSpecializations } = require("../controllers/specialization");

// GET /api/specializations — toate specializările (public)
// GET /api/specializations?facultyId=1 — filtrat pe facultate
router.get("/", getAllSpecializations);

module.exports = router;
