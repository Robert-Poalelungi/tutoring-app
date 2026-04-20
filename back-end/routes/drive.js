const router = require("express").Router();
const {
  createAppDriveFolder,
  deleteAppDriveItem,
  downloadDriveFolder,
  getAppDriveFiles,
  getProfessorConsultationFolderIds,
  uploadAppDriveFile,
} = require("../controllers/drive");
const { isAuthenticated, hasRole } = require("../middleware/auth");

// GET /api/drive/files — listare fisiere (public, read-only)
router.get("/files", getAppDriveFiles);

// GET /api/drive/download-folder — descarca folder ca ZIP (public)
router.get("/download-folder", downloadDriveFolder);

// GET /api/drive/my-folder-ids — folder IDs ale consultatiilor profesorului
router.get("/my-folder-ids", isAuthenticated, hasRole("professor"), getProfessorConsultationFolderIds);

// POST /api/drive/upload — incarca fisier (admin sau profesor in propriile consultații)
router.post("/upload", isAuthenticated, hasRole("admin", "professor"), uploadAppDriveFile);

// DELETE /api/drive/file/:id — sterge fisier sau folder (admin sau profesor in propriile consultații)
router.delete("/file/:id", isAuthenticated, hasRole("admin", "professor"), deleteAppDriveItem);

// POST /api/drive/folder — creeaza folder nou (admin only)
router.post("/folder", isAuthenticated, hasRole("admin"), createAppDriveFolder);

module.exports = router;
