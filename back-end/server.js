require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("./config/auth");
const sequelize = require("./config/db");
const routes = require("./routes");
const { startEmailScheduler } = require("./services/emailNotificationService");

const app = express();
const port = process.env.PORT || 5000;

// ─── MIDDLEWARE ───

app.use(
  cors({
    origin: process.env.ORIGIN_SITE,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ───

app.use("/api", routes);

// ─── START SERVER ───

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Baza de date sincronizată.");
    startEmailScheduler();
    app.listen(port, () => {
      console.log(`Serverul rulează la: http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Eroare la conectarea cu baza de date:", error);
  });
