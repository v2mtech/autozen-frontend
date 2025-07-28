import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Cria o pool de conexões com o banco de dados
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = pool;