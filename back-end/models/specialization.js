const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Specialization = sequelize.define("Specialization", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Specialization;