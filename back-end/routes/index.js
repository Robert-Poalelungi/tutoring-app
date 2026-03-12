const router = require("express").Router();

const authRoutes = require("./auth");
const userRoutes = require("./user");
const courseRoutes = require("./course");
const consultationRoutes = require("./consultation");
const adminRoutes = require("./admin");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/courses", courseRoutes);
router.use("/consultations", consultationRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
