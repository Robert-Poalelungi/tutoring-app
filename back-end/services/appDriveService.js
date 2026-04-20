const { Readable } = require("stream");
const { google } = require("googleapis");
const fs = require("fs");

const DRIVE_READONLY_SCOPE = ["https://www.googleapis.com/auth/drive.readonly"];
const DRIVE_WRITE_SCOPE = ["https://www.googleapis.com/auth/drive"];

const parseServiceAccountFromEnv = () => {
  const credentialsFilePath = process.env.GOOGLE_APP_DRIVE_SERVICE_ACCOUNT_FILE;
  if (credentialsFilePath) {
    try {
      const raw = fs.readFileSync(credentialsFilePath, "utf8");
      const parsed = JSON.parse(raw);
      return {
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (error) {
      throw new Error("GOOGLE_APP_DRIVE_SERVICE_ACCOUNT_FILE invalid or unreadable");
    }
  }

  const rawJson = process.env.GOOGLE_APP_DRIVE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      return {
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (error) {
      throw new Error("GOOGLE_APP_DRIVE_SERVICE_ACCOUNT_JSON invalid JSON");
    }
  }

  return {
    clientEmail: process.env.GOOGLE_APP_DRIVE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_APP_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY,
  };
};

const getDriveClientFromTokens = ({ refreshToken }) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.CALLBACK_URL,
  );
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
};

const getDriveClient = ({ writable = false } = {}) => {
  const { clientEmail, privateKey } = parseServiceAccountFromEnv();
  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google App Drive service account credentials");
  }

  const normalizedPrivateKey = String(privateKey).replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: normalizedPrivateKey,
    scopes: writable ? DRIVE_WRITE_SCOPE : DRIVE_READONLY_SCOPE,
  });

  return google.drive({ version: "v3", auth });
};

const sanitizeFolderName = (value, fallback) => {
  const normalized = String(value || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || fallback;
};

const ensureChildFolder = async (drive, { parentId, name }) => {
  const escapedName = String(name).replace(/'/g, "\\'");
  const query = [
    `'${parentId}' in parents`,
    `name = '${escapedName}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
  ].join(" and ");

  const existing = await drive.files.list({
    q: query,
    pageSize: 1,
    fields: "files(id, name, webViewLink)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  if (existing.data.files?.length) {
    return existing.data.files[0];
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  });

  return created.data;
};

const ensureConsultationMaterialsFolder = async ({ consultation }) => {
  const rootFolderId = process.env.GOOGLE_APP_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("Missing GOOGLE_APP_DRIVE_ROOT_FOLDER_ID");
  }

  if (!consultation?.course) {
    throw new Error("Consultation payload missing course relation");
  }

  const drive = getDriveClient({ writable: true });

  const facultyName = sanitizeFolderName(
    consultation.course.faculty?.abbreviation || consultation.course.faculty?.name,
    "Facultate",
  );
  const calendarYear = sanitizeFolderName(String(new Date(consultation.date).getFullYear()), "An calendaristic");
  const specializationName = sanitizeFolderName(
    consultation.course.specialization?.name,
    "Specializare",
  );
  const studyYearName = sanitizeFolderName(`An ${consultation.course.studyYear || "-"}`, "An studiu");
  const consultationFolderName = sanitizeFolderName(
    `${consultation.course.name} - ${consultation.date} ${String(consultation.time || "").slice(0, 5)} - C${consultation.id}`,
    `Consultatie-${consultation.id}`,
  );

  const facultyFolder = await ensureChildFolder(drive, { parentId: rootFolderId, name: facultyName });
  const calendarYearFolder = await ensureChildFolder(drive, { parentId: facultyFolder.id, name: calendarYear });
  const specializationFolder = await ensureChildFolder(drive, { parentId: calendarYearFolder.id, name: specializationName });
  const studyYearFolder = await ensureChildFolder(drive, { parentId: specializationFolder.id, name: studyYearName });
  const consultationFolder = await ensureChildFolder(drive, { parentId: studyYearFolder.id, name: consultationFolderName });

  return {
    folderId: consultationFolder.id,
    webViewLink: consultationFolder.webViewLink,
  };
};

const listAppDriveFiles = async ({ folderId, pageToken, query, pageSize }) => {
  const drive = getDriveClient();
  const configuredRoot = process.env.GOOGLE_APP_DRIVE_ROOT_FOLDER_ID;
  const effectiveFolderId = folderId || configuredRoot || "root";
  const safePageSize = Number.isInteger(Number(pageSize))
    ? Math.min(200, Math.max(1, Number(pageSize)))
    : 50;

  const whereClauses = [
    `'${effectiveFolderId}' in parents`,
    "trashed = false",
  ];

  if (query && String(query).trim()) {
    const escaped = String(query).trim().replace(/'/g, "\\'");
    whereClauses.push(`name contains '${escaped}'`);
  }

  const whereQuery = whereClauses.join(" and ");

  const response = await drive.files.list({
    q: whereQuery,
    orderBy: "folder,name",
    pageSize: safePageSize,
    pageToken: pageToken || undefined,
    fields:
      "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, parents)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  let currentFolderName = "";
  try {
    const currentFolder = await getDriveItemMetadata(drive, effectiveFolderId);
    currentFolderName = currentFolder?.name || "";
  } catch {
    currentFolderName = "";
  }

  return {
    folderId: effectiveFolderId,
    currentFolderName,
    nextPageToken: response.data.nextPageToken || null,
    files: response.data.files || [],
  };
};

const countAppDriveItems = async ({ folderId, query }) => {
  const drive = getDriveClient();
  const configuredRoot = process.env.GOOGLE_APP_DRIVE_ROOT_FOLDER_ID;
  const effectiveFolderId = folderId || configuredRoot || "root";

  const whereClauses = [
    `'${effectiveFolderId}' in parents`,
    "trashed = false",
  ];

  if (query && String(query).trim()) {
    const escaped = String(query).trim().replace(/'/g, "\\'");
    whereClauses.push(`name contains '${escaped}'`);
  }

  const whereQuery = whereClauses.join(" and ");

  let totalItems = 0;
  let nextPageToken = undefined;

  do {
    const page = await drive.files.list({
      q: whereQuery,
      pageSize: 1000,
      pageToken: nextPageToken,
      fields: "nextPageToken, files(id)",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    totalItems += (page.data.files || []).length;
    nextPageToken = page.data.nextPageToken || undefined;
  } while (nextPageToken);

  return totalItems;
};

const listDriveFolderChildren = async (drive, folderId) => {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    orderBy: 'folder,name',
    pageSize: 1000,
    fields: 'files(id, name, mimeType)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  return response.data.files || [];
};

const getDriveItemMetadata = async (drive, fileId) => {
  const response = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType',
    supportsAllDrives: true,
  });

  return response.data;
};

const uploadFileToDrive = async ({ drive, folderId, fileName, mimeType, buffer }) => {
  const stream = Readable.from(buffer);
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: stream,
    },
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
    supportsAllDrives: true,
  });
  return response.data;
};

const deleteDriveItem = async ({ drive, fileId }) => {
  try {
    // Încearcă ștergere permanentă (funcționează dacă service account-ul e proprietar sau organizer în Shared Drive)
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
    return;
  } catch (deleteErr) {
    const deleteStatus = deleteErr?.response?.status || deleteErr?.code;
    const deleteReason = deleteErr?.response?.data?.error?.errors?.[0]?.reason || '';
    console.error(`[Drive] files.delete failed (${deleteStatus} ${deleteReason}):`, deleteErr?.response?.data || deleteErr.message);

    if (deleteStatus !== 403 && deleteStatus !== 401) {
      throw deleteErr;
    }
  }

  // Fallback: mută în coș (funcționează pentru fișierele din My Drive unde service account-ul e editor)
  try {
    await drive.files.update({
      fileId,
      requestBody: { trashed: true },
      supportsAllDrives: true,
    });
    return;
  } catch (trashErr) {
    const trashStatus = trashErr?.response?.status || trashErr?.code;
    const trashReason = trashErr?.response?.data?.error?.errors?.[0]?.reason || '';
    console.error(`[Drive] files.update(trashed) failed (${trashStatus} ${trashReason}):`, trashErr?.response?.data || trashErr.message);

    // Shared Drive: ștergerea permanentă necesită rol de organizer.
    // Construim un mesaj clar pentru utilizator.
    const googleMsg = trashErr?.response?.data?.error?.message || trashErr.message || '';
    throw new Error(
      `Nu se poate șterge acest element (${googleMsg || 'permisiuni insuficiente'}). ` +
      'Asigură-te că service account-ul are rol de Organizer în Shared Drive.'
    );
  }
};

const getWritableDriveClient = async (user) => {
  const { User } = require("../models");
  const { Op } = require("sequelize");

  if (user?.driveRefreshToken) {
    return getDriveClientFromTokens({
      accessToken: user.driveAccessToken,
      refreshToken: user.driveRefreshToken,
    });
  }

  const adminWithTokens = await User.findOne({
    where: { role: "admin", driveRefreshToken: { [Op.not]: null } },
  });
  if (adminWithTokens) {
    return getDriveClientFromTokens({
      accessToken: adminWithTokens.driveAccessToken,
      refreshToken: adminWithTokens.driveRefreshToken,
    });
  }

  return getDriveClient({ writable: true });
};

module.exports = {
  countAppDriveItems,
  deleteDriveItem,
  ensureChildFolder,
  ensureConsultationMaterialsFolder,
  getDriveClient,
  getDriveClientFromTokens,
  getDriveItemMetadata,
  getWritableDriveClient,
  listDriveFolderChildren,
  listAppDriveFiles,
  uploadFileToDrive,
};
