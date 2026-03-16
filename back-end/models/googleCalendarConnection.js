const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GoogleCalendarConnection = sequelize.define("GoogleCalendarConnection", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  googleEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  calendarId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "primary",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = GoogleCalendarConnection;
