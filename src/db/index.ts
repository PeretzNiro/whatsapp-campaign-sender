import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { env } from '../env.js';

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Cleanup old delivery events (older than 30 days)
export async function cleanupOldDeliveryEvents() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await pool.query(
      'DELETE FROM delivery_events WHERE timestamp < $1',
      [thirtyDaysAgo]
    );

    console.log(`Cleaned up ${result.rowCount} old delivery events`);
    return result.rowCount;
  } catch (error) {
    console.error('Failed to cleanup old delivery events:', error);
    return 0;
  }
}

// Schedule cleanup to run daily
if (env.NODE_ENV === 'production') {
  setInterval(cleanupOldDeliveryEvents, 24 * 60 * 60 * 1000); // Every 24 hours
}

export * from './schema.js';
