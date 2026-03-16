const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ConsultationCalendarSync = sequelize.define("ConsultationCalendarSync", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  googleEventId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  calendarId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  syncStatus: {
    type: DataTypes.ENUM("synced", "failed", "pending"),
    allowNull: false,
    defaultValue: "pending",
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = ConsultationCalendarSync;
