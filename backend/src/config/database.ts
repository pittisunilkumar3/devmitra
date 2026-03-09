import mysql from 'mysql2/promise';
import fs from 'fs';
import type { ResultSetHeader, FieldPacket } from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const xamppSocket = '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
const useSocket = fs.existsSync(xamppSocket);

interface DbConfig {
  socketPath?: string;
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
}

const dbConfig: DbConfig = useSocket
  ? {
      socketPath: xamppSocket,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'book_a_developer',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'book_a_developer',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

const pool = mysql.createPool(dbConfig);

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T[];
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function insert(sql: string, params?: any[]): Promise<number> {
  const [result] = await pool.execute(sql, params);
  const resultSet = result as ResultSetHeader;
  return resultSet.insertId;
}

export async function execute(sql: string, params?: any[]): Promise<number> {
  const [result] = await pool.execute(sql, params);
  const resultSet = result as ResultSetHeader;
  return resultSet.affectedRows;
}

export default pool;
