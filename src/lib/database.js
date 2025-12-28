// Neon database utility (automatically gets DATABASE_URL from Vercel)
import { neon } from '@neondatabase/serverless';

// Vercel automatically provides DATABASE_URL environment variable
export const sql = neon(process.env.DATABASE_URL);

// Helper function for queries
export async function query(text, params) {
  try {
    const result = await sql(text, ...(params || []));
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Initialize database schema
export async function initDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS verification_sessions (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        roblox_username VARCHAR(255),
        roblox_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending'
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS linked_accounts (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        discord_username VARCHAR(255),
        roblox_id VARCHAR(255) UNIQUE NOT NULL,
        roblox_username VARCHAR(255) NOT NULL,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        linked_servers JSONB DEFAULT '[]'
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255),
        roblox_username VARCHAR(255),
        ip_address VARCHAR(45),
        action VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_discord_id ON verification_sessions(discord_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_session_token ON verification_sessions(session_token)');
    await query('CREATE INDEX IF NOT EXISTS idx_linked_discord ON linked_accounts(discord_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_linked_roblox ON linked_accounts(roblox_id)');
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
