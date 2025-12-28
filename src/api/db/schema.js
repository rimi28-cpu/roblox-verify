import { query } from './neon.js';

export async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Create tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS linked_accounts (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        discord_username VARCHAR(255),
        roblox_id VARCHAR(255) UNIQUE NOT NULL,
        roblox_username VARCHAR(255) NOT NULL,
        verification_token VARCHAR(512),
        linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        linked_servers JSONB DEFAULT '[]'::jsonb,
        is_verified BOOLEAN DEFAULT FALSE
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS verification_sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(512) UNIQUE NOT NULL,
        discord_id VARCHAR(255) NOT NULL,
        roblox_username VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        ip_address VARCHAR(45)
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS server_links (
        id SERIAL PRIMARY KEY,
        discord_user_id VARCHAR(255) NOT NULL,
        discord_server_id VARCHAR(255) NOT NULL,
        roblox_user_id VARCHAR(255) NOT NULL,
        linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(discord_user_id, discord_server_id)
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255),
        roblox_username VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50),
        details TEXT
      )
    `);
    
    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_discord_id ON linked_accounts(discord_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_roblox_id ON linked_accounts(roblox_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_session_token ON verification_sessions(session_token)');
    await query('CREATE INDEX IF NOT EXISTS idx_expires_at ON verification_sessions(expires_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_discord_server ON server_links(discord_user_id, discord_server_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_verification_logs_created ON verification_logs(created_at)');
    
    console.log('✅ Database schema initialized successfully!');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
