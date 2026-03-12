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
});

module.exports = Consultation;
