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
});

module.exports = UserConsultation;
