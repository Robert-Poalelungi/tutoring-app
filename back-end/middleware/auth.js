const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Verifică dacă utilizatorul este autentificat (are JWT valid)
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "Nu ești autentificat." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Utilizator inexistent." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid sau expirat." });
  }
};

// Verifică dacă utilizatorul are unul din rolurile specificate
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Nu ești autentificat." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Nu ai permisiunea necesară." });
    }

    next();
  };
};

// Setează req.user dacă există un token valid, fără a bloca dacă nu există
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (user) req.user = user;
  } catch {
    // token invalid — continuă fără utilizator
  }
  next();
};

module.exports = { isAuthenticated, hasRole, optionalAuth };
