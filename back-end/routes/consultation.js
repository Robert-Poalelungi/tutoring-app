const router = require("express").Router();
const {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  cancelConsultation,
  reactivateConsultation,
  completeConsultation,
  deleteConsultation,
  getMyConsultations,
  enrollConsultation,
  unenrollConsultation,
  getStudentConsultations,
  backfillConsultationFolders,
} = require("../controllers/consultation");
const { isAuthenticated, hasRole, optionalAuth } = require("../middleware/auth");

// ─── STUDENT ───

// GET /api/consultations/student/my — consultațiile studentului (auto + manual)
router.get("/student/my", isAuthenticated, hasRole("student"), getStudentConsultations);

// POST /api/consultations/student/enroll — student se înscrie la consultație (recuperare)
router.post("/student/enroll", isAuthenticated, hasRole("student"), enrollConsultation);

// DELETE /api/consultations/student/unenroll/:id — student se retrage din consultație
router.delete("/student/unenroll/:id", isAuthenticated, hasRole("student"), unenrollConsultation);

// ─── PROFESOR ───

// GET /api/consultations/professor/my — consultațiile profesorului
router.get("/professor/my", isAuthenticated, hasRole("professor", "admin"), getMyConsultations);

// POST /api/consultations/create — creează consultație
router.post("/create", isAuthenticated, hasRole("professor", "admin"), createConsultation);

// PUT /api/consultations/update/:id — editează consultație
router.put("/update/:id", isAuthenticated, hasRole("professor", "admin"), updateConsultation);

// PUT /api/consultations/cancel/:id — anulează consultație
router.put("/cancel/:id", isAuthenticated, hasRole("professor", "admin"), cancelConsultation);

// PUT /api/consultations/reactivate/:id — reactivează consultație anulată
router.put("/reactivate/:id", isAuthenticated, hasRole("professor", "admin"), reactivateConsultation);

// PUT /api/consultations/complete/:id — finalizează consultație
router.put("/complete/:id", isAuthenticated, hasRole("professor", "admin"), completeConsultation);

// DELETE /api/consultations/delete/:id — șterge consultație (permanent din DB)
router.delete("/delete/:id", isAuthenticated, hasRole("professor", "admin"), deleteConsultation);

// POST /api/consultations/admin/sync-drive-folders — populează driveFolderId pentru toate consultațiile
router.post("/admin/sync-drive-folders", isAuthenticated, hasRole("admin"), backfillConsultationFolders);

// ─── PUBLIC (la final, /:id nu interceptează rutele de mai sus) ───

// GET /api/consultations — toate consultațiile (pentru calendar public)
router.get("/", optionalAuth, getAllConsultations);

// GET /api/consultations/:id — o consultație după ID
router.get("/:id", getConsultationById);

module.exports = router;
