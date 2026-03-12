const router = require("express").Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUserRole,
  deleteUser,
  createCourse,
  updateCourse,
  deleteCourse,
  assignCourse,
  unassignCourse,
} = require("../controllers/admin");
const { isAuthenticated, hasRole } = require("../middleware/auth");

// Toate rutele de admin necesită autentificare + rol admin
router.use(isAuthenticated, hasRole("admin"));

// ─── USERS ───

// GET /api/admin/users — toți utilizatorii
router.get("/users", getAllUsers);

// GET /api/admin/users/:id — un utilizator
router.get("/users/:id", getUserById);

// POST /api/admin/users — creare utilizator
router.post("/users", createUser);

// PUT /api/admin/users/:id/role — modificare rol
router.put("/users/:id/role", updateUserRole);

// DELETE /api/admin/users/:id — ștergere utilizator
router.delete("/users/:id", deleteUser);

// ─── COURSES ───

// POST /api/admin/courses — creare materie
router.post("/courses", createCourse);

// PUT /api/admin/courses/:id — editare materie
router.put("/courses/:id", updateCourse);

// DELETE /api/admin/courses/:id — ștergere materie
router.delete("/courses/:id", deleteCourse);

// ─── PROFESSOR ↔ COURSES ───

// POST /api/admin/professors/:id/courses — atribuie materie profesorului
router.post("/professors/:id/courses", assignCourse);

// DELETE /api/admin/professors/:id/courses — elimină materie de la profesor
router.delete("/professors/:id/courses", unassignCourse);

module.exports = router;
