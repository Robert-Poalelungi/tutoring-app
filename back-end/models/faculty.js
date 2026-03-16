const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Faculty = sequelize.define("Faculty", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  abbreviation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Faculty;