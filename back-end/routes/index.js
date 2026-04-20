const router = require("express").Router();

const authRoutes = require("./auth");
const userRoutes = require("./user");
const facultyRoutes = require("./faculty");
const specializationRoutes = require("./specialization");
const courseRoutes = require("./course");
const consultationRoutes = require("./consultation");
const adminRoutes = require("./admin");
const settingsRoutes = require("./settings");
const googleCalendarRoutes = require("./googleCalendar");
const driveRoutes = require("./drive");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/faculties", facultyRoutes);
router.use("/specializations", specializationRoutes);
router.use("/courses", courseRoutes);
router.use("/consultations", consultationRoutes);
router.use("/admin", adminRoutes);
router.use("/settings", settingsRoutes);
router.use("/google-calendar", googleCalendarRoutes);
router.use("/drive", driveRoutes);

module.exports = router;
