const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || process.env.MYSQL_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306,
  user:     process.env.DB_USER     || process.env.MYSQL_USER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME     || process.env.MYSQL_DATABASE || 'smart_attendance',
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
