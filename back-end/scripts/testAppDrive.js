require("dotenv").config();

const sequelize = require("../config/db");
const { Consultation, Course, Faculty, Specialization } = require("../models");
const { ensureConsultationMaterialsFolder, listAppDriveFiles } = require("../services/appDriveService");

(async () => {
  try {
    console.log("[test] connecting db...");
    await sequelize.authenticate();

    console.log("[test] listing root files...");
    const listResult = await listAppDriveFiles({});
    console.log("[test] root ok:", {
      folderId: listResult.folderId,
      filesCount: Array.isArray(listResult.files) ? listResult.files.length : 0,
      hasNext: Boolean(listResult.nextPageToken),
    });

    console.log("[test] loading one consultation...");
    const consultation = await Consultation.findOne({
      include: [
        {
          model: Course,
          as: "course",
          include: [
            { model: Faculty, as: "faculty" },
            { model: Specialization, as: "specialization" },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    if (!consultation) {
      console.log("[test] no consultations found. drive listing works.");
      process.exit(0);
    }

    console.log("[test] ensuring consultation folder...");
    const folder = await ensureConsultationMaterialsFolder({ consultation });
    console.log("[test] consultation folder ok:", {
      consultationId: consultation.id,
      folderId: folder.folderId,
      webViewLink: folder.webViewLink,
    });

    process.exit(0);
  } catch (error) {
    console.error("[test] failed:", error.message);
    process.exit(1);
  }
})();
