const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../models");
const detectStudyYear = require("../utils/detectStudyYear");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ where: { email } });

        if (!user) {
          user = await User.create({
            email,
            firstName: profile.name.givenName || "",
            lastName: profile.name.familyName || "",
            role: "student",
            studyYear: detectStudyYear(email),
            isProfileCompleted: false,
            driveAccessToken: accessToken || null,
            driveRefreshToken: refreshToken || null,
          });
        } else {
          if (!user.studyYear) {
            user.studyYear = detectStudyYear(email);
          }
          user.driveAccessToken = accessToken || user.driveAccessToken;
          if (refreshToken) user.driveRefreshToken = refreshToken;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
