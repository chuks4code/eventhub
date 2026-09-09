const { Pool } = require("pg");                 // Import Pool from the PostgreSQL package
require("dotenv").config();                    // Load variables from the .env file

const pool = new Pool({                         // Create a PostgreSQL connection pool
    user: process.env.DB_USER,                  // PostgreSQL username
    host: process.env.DB_HOST,                  // Database server address
    database: process.env.DB_NAME,              // PostgreSQL database name
    password: process.env.DB_PASSWORD,          // PostgreSQL password
    port: process.env.DB_PORT,                  // PostgreSQL port (usually 5432)
});

module.exports = pool;                          // Export pool so other files can use the database