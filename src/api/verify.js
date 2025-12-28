import { query } from '../lib/database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // Check verification status
    return handleGet(req, res);
  }
  
  if (req.method === 'POST') {
    // Complete verification
    return handlePost(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  try {
    const { discordId } = req.query;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID required' });
    }
    
    const result = await query(
      `SELECT * FROM linked_accounts WHERE discord_id = $1`,
      [discordId]
    );
    
    if (result.length === 0) {
      return res.json({
        verified: false,
        message: 'No linked account found'
      });
    }
    
    res.json({
      verified: true,
      robloxUsername: result[0].roblox_username,
      robloxId: result[0].roblox_id,
      verifiedAt: result[0].verified_at
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { discordId, robloxId, robloxUsername, verificationToken } = req.body;
    
    if (!discordId || !robloxId || !robloxUsername) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify session if token provided
    if (verificationToken) {
      const session = await query(
        `SELECT * FROM verification_sessions 
         WHERE discord_id = $1 AND session_token = $2 AND expires_at > NOW()`,
        [discordId, verificationToken]
      );
      
      if (session.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired verification session' });
      }
    }
    
    // Link account
    const result = await query(
      `INSERT INTO linked_accounts (discord_id, roblox_id, roblox_username) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (discord_id) 
       DO UPDATE SET roblox_id = $2, roblox_username = $3, verified_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [discordId, robloxId, robloxUsername]
    );
    
    // Update session status
    if (verificationToken) {
      await query(
        `UPDATE verification_sessions SET status = 'completed' 
         WHERE discord_id = $1 AND session_token = $2`,
        [discordId, verificationToken]
      );
    }
    
    res.json({
      success: true,
      message: 'Account linked successfully',
      data: result[0]
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
