const { Specialization, Faculty } = require("../models");

// GET /api/specializations — toate specializările (opțional filtrat pe facultyId)
const getAllSpecializations = async (req, res) => {
  try {
    const where = {};
    if (req.query.facultyId) {
      where.facultyId = req.query.facultyId;
    }

    const specializations = await Specialization.findAll({
      where,
      include: [{ model: Faculty, as: "faculty" }],
      order: [["name", "ASC"]],
    });

    return res.status(200).json(specializations);
  } catch (error) {
    return res.status(500).json({ message: "Eroare server.", error: error.message });
  }
};

module.exports = { getAllSpecializations };
