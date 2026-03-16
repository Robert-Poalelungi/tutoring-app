const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CalendarSessions = sequelize.define("CalendarSessions", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  activeSession: {
    type: DataTypes.ENUM("winter", "summer"),
    allowNull: false,
    defaultValue: "winter",
  },
  winterMonths: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [1, 2],
  },
  summerMonths: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [6, 7],
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = CalendarSessions;
