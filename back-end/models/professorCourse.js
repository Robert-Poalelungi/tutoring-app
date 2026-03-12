const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProfessorCourse = sequelize.define("ProfessorCourse", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
});

module.exports = ProfessorCourse;
