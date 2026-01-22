import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

// Database configuration
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '54320'),
  database: process.env.DATABASE_NAME || 'misarh_db',
  user: process.env.DATABASE_USER || 'misarh_user',
  password: process.env.DATABASE_PASSWORD || 'misarh_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
 
// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function
export const query = async (
  text: string,
  params?: any[]
): Promise<any> => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Transaction helper
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Close all connections
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Database pool closed');
};

export default pool;
