require("dotenv").config(); // Load environment variables

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory:"./database/migrations"
    },
    pool: { min: 2, max: 10 },
  },
};
