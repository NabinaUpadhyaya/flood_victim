/**
 * MySQL Database Connection Pool Configuration
 * Handles connection management, utf8mb4 encoding, and query error trapping.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

let dbConfig;
if (connectionUri) {
  dbConfig = {
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+05:45',
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  };
} else {
  const isCloudHost =
    process.env.DB_HOST &&
    !['localhost', '127.0.0.1'].includes(process.env.DB_HOST.trim().toLowerCase());
  const useSsl =
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1' ||
    (isCloudHost && process.env.DB_SSL !== 'false');

  dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'insec_data',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+05:45', // Nepal Standard Time
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };
}

const pool = mysql.createPool(dbConfig);

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully! (Pool ready)');
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
  }
}

testConnection();

module.exports = pool;
