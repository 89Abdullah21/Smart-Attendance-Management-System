const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'smart_attendance',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

module.exports = {
  pool,
  /**
   * Helper function to execute queries safely.
   * Returns [rows, fields] — use rows directly.
   * @param {string} text
   * @param {any[]} params
   */
  query: (text, params) => pool.execute(text, params),
};
