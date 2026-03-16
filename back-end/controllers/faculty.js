const { Faculty } = require("../models");

// GET /api/faculties — toate facultățile (public)
const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.findAll({
      order: [["name", "ASC"]],
    });
    return res.status(200).json(faculties);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = { getAllFaculties };
