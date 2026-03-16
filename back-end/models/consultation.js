const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Consultation = sequelize.define("Consultation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 120,
  },
  type: {
    type: DataTypes.ENUM("online", "fizic"),
    allowNull: false,
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  materialsLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  serie: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "Toate",
  },
  status: {
    type: DataTypes.ENUM("draft", "published", "cancelled", "completed"),
    allowNull: false,
    defaultValue: "published",
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Consultation;
