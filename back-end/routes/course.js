const router = require("express").Router();
const { getAllCourses, getCourseById, getCoursesByFilter, getProfessorCourses } = require("../controllers/course");
const { isAuthenticated, hasRole } = require("../middleware/auth");

// GET /api/courses — toate materiile
router.get("/", getAllCourses);

// GET /api/courses/filter — materii filtrate pe an și specializare
router.get("/filter", getCoursesByFilter);

// GET /api/courses/my — materiile profesorului autentificat
router.get("/my", isAuthenticated, hasRole("professor"), getProfessorCourses);

// GET /api/courses/:id — o materie după ID
router.get("/:id", getCourseById);

module.exports = router;
