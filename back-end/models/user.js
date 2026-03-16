const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM("student", "professor", "admin"),
    allowNull: false,
    defaultValue: "student",
  },
  facultyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  specializationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  studyYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isProfileCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  emailNotificationsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = User;
