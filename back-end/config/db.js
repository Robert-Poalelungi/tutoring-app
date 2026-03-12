const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: "localhost",
    dialect: "mysql",
    define: {
      charset: "utf8",
      collate: "utf8_general_ci",
      timestamps: true,
    },
    logging: false,
  }
);

module.exports = sequelize;
