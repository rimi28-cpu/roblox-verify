// Database utilities - Neon is automatically provided by Vercel
import { neon } from '@neondatabase/serverless';

// Vercel automatically provides DATABASE_URL
export const sql = neon(process.env.DATABASE_URL);

// Simple query helper
export async function query(text, params) {
  try {
    const result = await sql(text, ...(params || []));
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Initialize database (call this once)
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS verification_sessions (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
