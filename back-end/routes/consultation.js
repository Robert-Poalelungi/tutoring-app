const router = require("express").Router();
const {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getMyConsultations,
  enrollConsultation,
  unenrollConsultation,
  getStudentConsultations,
} = require("../controllers/consultation");
const { isAuthenticated, hasRole } = require("../middleware/auth");

// ─── STUDENT ───

// GET /api/consultations/student/my — consultațiile studentului (auto + manual)
router.get("/student/my", isAuthenticated, hasRole("student"), getStudentConsultations);

// POST /api/consultations/student/enroll — student se înscrie la consultație (recuperare)
router.post("/student/enroll", isAuthenticated, hasRole("student"), enrollConsultation);

// DELETE /api/consultations/student/unenroll/:id — student elimină consultație manuală
router.delete("/student/unenroll/:id", isAuthenticated, hasRole("student"), unenrollConsultation);

// ─── PROFESOR ───

// GET /api/consultations/professor/my — consultațiile profesorului
router.get("/professor/my", isAuthenticated, hasRole("professor", "admin"), getMyConsultations);

// POST /api/consultations/create — creează consultație
router.post("/create", isAuthenticated, hasRole("professor", "admin"), createConsultation);

// PUT /api/consultations/update/:id — editează consultație
router.put("/update/:id", isAuthenticated, hasRole("professor", "admin"), updateConsultation);

// DELETE /api/consultations/delete/:id — șterge consultație
router.delete("/delete/:id", isAuthenticated, hasRole("professor", "admin"), deleteConsultation);

// ─── PUBLIC (la final, /:id nu interceptează rutele de mai sus) ───

// GET /api/consultations — toate consultațiile (pentru calendar public)
router.get("/", getAllConsultations);

// GET /api/consultations/:id — o consultație după ID
router.get("/:id", getConsultationById);

module.exports = router;
