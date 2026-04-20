const archiver = require("archiver");
const {
  countAppDriveItems,
  deleteDriveItem,
  ensureChildFolder,
  getDriveClient,
  getDriveItemMetadata,
  getWritableDriveClient,
  listAppDriveFiles,
  listDriveFolderChildren,
  uploadFileToDrive,
} = require("../services/appDriveService");

const { Consultation } = require("../models");
const { Op } = require("sequelize");

const isProfessorOwnerOfFolder = async (professorId, folderId) => {
  const consultation = await Consultation.findOne({
    where: { professorId, driveFolderId: folderId },
  });
  return Boolean(consultation);
};

const isDriveEnabled = () =>
  String(process.env.GOOGLE_APP_DRIVE_ENABLED || "false").toLowerCase() === "true";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

const EXPORT_MIME_MAP = {
  "application/vnd.google-apps.document": {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: ".pptx",
  },
  "application/vnd.google-apps.drawing": {
    mimeType: "image/png",
    extension: ".png",
  },
};

const sanitizeZipEntryName = (value, fallback = "item") => {
  const cleaned = String(value || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || fallback;
};

const normalizePath = (...parts) =>
  parts
    .filter(Boolean)
    .map((part) => sanitizeZipEntryName(part))
    .join("/");

const appendDriveFolderToArchive = async ({ drive, archive, folderId, currentPath }) => {
  const children = await listDriveFolderChildren(drive, folderId);

  for (const child of children) {
    const itemName = sanitizeZipEntryName(child.name);
    const targetPath = normalizePath(currentPath, itemName);

    if (child.mimeType === FOLDER_MIME_TYPE) {
      await appendDriveFolderToArchive({
        drive,
        archive,
        folderId: child.id,
        currentPath: targetPath,
      });
      continue;
    }

    const exportSpec = EXPORT_MIME_MAP[child.mimeType];

    if (exportSpec) {
      const exportResponse = await drive.files.export(
        {
          fileId: child.id,
          mimeType: exportSpec.mimeType,
        },
        {
          responseType: "stream",
        },
      );

      const hasExtension = itemName.toLowerCase().endsWith(exportSpec.extension);
      const exportedName = hasExtension ? targetPath : `${targetPath}${exportSpec.extension}`;
      archive.append(exportResponse.data, { name: exportedName });
      continue;
    }

    if (String(child.mimeType || "").startsWith("application/vnd.google-apps.")) {
      // Skip unsupported native Google files (forms, sites etc.) instead of failing full archive.
      continue;
    }

    const fileResponse = await drive.files.get(
      {
        fileId: child.id,
        alt: "media",
        supportsAllDrives: true,
      },
      {
        responseType: "stream",
      },
    );

    archive.append(fileResponse.data, { name: targetPath });
  }
};

const getAppDriveFiles = async (req, res) => {
  try {
    if (String(process.env.GOOGLE_APP_DRIVE_ENABLED || "false").toLowerCase() !== "true") {
      return res.status(503).json({
        message: "Drive-ul aplicatiei nu este activat.",
      });
    }

    const data = await listAppDriveFiles({
      folderId: req.query.folderId,
      pageToken: req.query.pageToken,
      pageSize: req.query.pageSize,
      query: req.query.q,
    });

    const includeTotal = String(req.query.includeTotal || "false").toLowerCase() === "true";
    if (includeTotal) {
      const safePageSize = Number.isInteger(Number(req.query.pageSize))
        ? Math.min(200, Math.max(1, Number(req.query.pageSize)))
        : 50;

      const totalItems = await countAppDriveItems({
        folderId: req.query.folderId,
        query: req.query.q,
      });

      data.totalItems = totalItems;
      data.totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Nu am putut incarca fisierele din Drive-ul aplicatiei.",
      error: error.message,
    });
  }
};

const downloadDriveFolder = async (req, res) => {
  try {
    if (String(process.env.GOOGLE_APP_DRIVE_ENABLED || "false").toLowerCase() !== "true") {
      return res.status(503).json({
        message: "Drive-ul aplicatiei nu este activat.",
      });
    }

    const folderId = String(req.query.folderId || "").trim();
    if (!folderId) {
      return res.status(400).json({
        message: "Lipseste parametrul folderId.",
      });
    }

    const drive = getDriveClient();
    const folder = await getDriveItemMetadata(drive, folderId);

    if (folder?.mimeType !== FOLDER_MIME_TYPE) {
      return res.status(400).json({
        message: "folderId trebuie sa indice un folder.",
      });
    }

    const zipBaseName = sanitizeZipEntryName(folder.name, "folder");
    const zipName = `${zipBaseName}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (archiveError) => {
      if (!res.headersSent) {
        res.status(500).json({
          message: "Nu am putut genera arhiva pentru folder.",
          error: archiveError.message,
        });
      }
      res.end();
    });

    archive.pipe(res);
    await appendDriveFolderToArchive({
      drive,
      archive,
      folderId,
      currentPath: zipBaseName,
    });
    await archive.finalize();
    return undefined;
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Nu am putut descarca folderul din Drive-ul aplicatiei.",
        error: error.message,
      });
    }

    res.end();
    return undefined;
  }
};

const uploadAppDriveFile = async (req, res) => {
  try {
    if (!isDriveEnabled()) {
      return res.status(503).json({ message: "Drive-ul aplicatiei nu este activat." });
    }

    const { folderId, name, mimeType, data } = req.body;
    if (!folderId || !name || !data) {
      return res.status(400).json({ message: "Lipsesc parametrii folderId, name sau data." });
    }

    if (req.user.role === "professor") {
      const isOwner = await isProfessorOwnerOfFolder(req.user.id, folderId);
      if (!isOwner) {
        return res.status(403).json({ message: "Nu ai acces la acest folder." });
      }
    }

    const buffer = Buffer.from(data, "base64");
    const drive = await getWritableDriveClient(req.user);
    const file = await uploadFileToDrive({
      drive,
      folderId,
      fileName: name,
      mimeType: mimeType || "application/octet-stream",
      buffer,
    });

    return res.status(201).json({ file });
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error?.response?.data || error.message;
    console.error("[Drive] upload error:", detail);
    return res.status(500).json({ message: "Nu am putut incarca fisierul.", error: String(detail) });
  }
};

const deleteAppDriveItem = async (req, res) => {
  try {
    if (!isDriveEnabled()) {
      return res.status(503).json({ message: "Drive-ul aplicatiei nu este activat." });
    }

    const fileId = String(req.params.id || "").trim();
    if (!fileId) {
      return res.status(400).json({ message: "Lipseste fileId." });
    }

    if (req.user.role === "professor") {
      const readDrive = getDriveClient();
      const meta = await readDrive.files.get({
        fileId,
        fields: "id,parents",
        supportsAllDrives: true,
      });
      const parentId = meta.data.parents?.[0];
      if (!parentId) {
        return res.status(403).json({ message: "Nu ai acces să ștergi acest fișier." });
      }
      const isOwner = await isProfessorOwnerOfFolder(req.user.id, parentId);
      if (!isOwner) {
        return res.status(403).json({ message: "Nu ai acces să ștergi acest fișier." });
      }
    }

    const drive = await getWritableDriveClient(req.user);
    await deleteDriveItem({ drive, fileId });

    return res.status(200).json({ message: "Sters cu succes." });
  } catch (error) {
    return res.status(500).json({ message: "Nu am putut sterge elementul.", error: error.message });
  }
};

const getProfessorConsultationFolderIds = async (req, res) => {
  try {
    const consultations = await Consultation.findAll({
      where: {
        professorId: req.user.id,
        driveFolderId: { [Op.not]: null },
      },
      attributes: ["driveFolderId"],
    });
    return res.status(200).json({ folderIds: consultations.map((c) => c.driveFolderId) });
  } catch (error) {
    return res.status(500).json({ message: "Nu am putut încărca folderele.", error: error.message });
  }
};

const createAppDriveFolder = async (req, res) => {
  try {
    if (!isDriveEnabled()) {
      return res.status(503).json({ message: "Drive-ul aplicatiei nu este activat." });
    }

    const parentId = String(req.body.parentId || "").trim();
    const name = String(req.body.name || "").trim();
    if (!parentId || !name) {
      return res.status(400).json({ message: "Lipsesc parametrii parentId sau name." });
    }

    const drive = await getWritableDriveClient(req.user);
    const folder = await ensureChildFolder(drive, { parentId, name });

    return res.status(201).json({ folder });
  } catch (error) {
    return res.status(500).json({ message: "Nu am putut crea folderul.", error: error.message });
  }
};

module.exports = {
  createAppDriveFolder,
  deleteAppDriveItem,
  downloadDriveFolder,
  getAppDriveFiles,
  getProfessorConsultationFolderIds,
  uploadAppDriveFile,
};
