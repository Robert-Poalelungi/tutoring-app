const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define("Course", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studyYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Course;
