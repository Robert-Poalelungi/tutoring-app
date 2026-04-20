const router = require("express").Router();
const passport = require("passport");
const { setAuthCookie } = require("../controllers/user");

// Autentificare Google standard (studenți, profesori)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Autentificare Google cu acces Drive (doar pentru admin)
router.get(
  "/google/admin",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/drive"],
    accessType: "offline",
    prompt: "consent",
  })
);

// Callback-ul de la Google OAuth
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Creează JWT și setează cookie-ul
    setAuthCookie(req.user, res);

    // Redirecționare în funcție de starea profilului
    if (!req.user.isProfileCompleted) {
      return res.redirect(`${process.env.ORIGIN_SITE}/profil`);
    }

    // Redirecționare în funcție de rol
    switch (req.user.role) {
      case "admin":
        return res.redirect(`${process.env.ORIGIN_SITE}/admin`);
      case "professor":
        return res.redirect(`${process.env.ORIGIN_SITE}/profesor`);
      default:
        return res.redirect(`${process.env.ORIGIN_SITE}/student`);
    }
  }
);

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  req.logout(() => {
    res.redirect(process.env.ORIGIN_SITE);
  });
});

module.exports = router;
