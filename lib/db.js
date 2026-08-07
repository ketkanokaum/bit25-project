import 'server-only'
import mysql from 'mysql2/promise';

let port = 3306;
if (process.env.DB_PORT) {
  port = Number(process.env.DB_PORT);
}

let sslOption = undefined;
if (process.env.DB_SSL === 'true') {
  sslOption = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  ssl: sslOption,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
