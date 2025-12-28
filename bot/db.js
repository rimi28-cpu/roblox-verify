require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

// For the bot, we need to connect to the same Neon database
// We'll use the same DATABASE_URL that Vercel provides
// For local dev, we can set DATABASE_URL in .env
const sql = neon(process.env.DATABASE_URL);

module.exports = {
  query: async (text, params) => {
    try {
      const result = await sql(text, ...(params || []));
      return result;
    } catch (error) {
      console.error('Bot database error:', error);
      throw error;
    }
  },
  
  // Check if user is verified
  isVerified: async (discordId) => {
    const result = await sql(
      `SELECT * FROM linked_accounts WHERE discord_id = $1`,
      [discordId]
    );
    return result.length > 0;
  },
  
  // Get verification info
  getVerificationInfo: async (discordId) => {
    const result = await sql(
      `SELECT * FROM linked_accounts WHERE discord_id = $1`,
      [discordId]
    );
    return result.length > 0 ? result[0] : null;
  },
  
  // Create verification session
  createSession: async (discordId, token) => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await sql(
      `INSERT INTO verification_sessions (discord_id, session_token, expires_at, status) 
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (discord_id) 
       DO UPDATE SET session_token = $2, expires_at = $3, status = 'pending'`,
      [discordId, token, expiresAt]
    );
  },
  
  // Get session
  getSession: async (token) => {
    const result = await sql(
      `SELECT * FROM verification_sessions 
       WHERE session_token = $1 AND expires_at > NOW() AND status = 'pending'`,
      [token]
    );
    return result.length > 0 ? result[0] : null;
  }
};
