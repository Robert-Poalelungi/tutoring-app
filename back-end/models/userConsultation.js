const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserConsultation = sequelize.define("UserConsultation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  source: {
    type: DataTypes.ENUM("auto", "manual"),
    allowNull: false,
    defaultValue: "auto",
  },
  status: {
    type: DataTypes.ENUM("active", "withdrawn"),
    allowNull: false,
    defaultValue: "active",
  },
  enrolledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  withdrawnAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reminder1daySent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  reminder1hourSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = UserConsultation;
