import { query } from './db/neon.js';
import { logVerificationAttempt } from './db/queries.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret (optional)
  const webhookSecret = req.headers['x-webhook-secret'];
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { type, data } = req.body;
    
    switch (type) {
      case 'discord_verification':
        // Handle Discord verification webhook
        await handleDiscordVerification(data);
        break;
        
      case 'roblox_login':
        // Handle Roblox login webhook
        await handleRobloxLogin(data);
        break;
        
      case 'server_link':
        // Handle server linking webhook
        await handleServerLink(data);
        break;
        
      default:
        console.log('Unknown webhook type:', type);
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDiscordVerification(data) {
  const { discordId, discordUsername, action, details } = data;
  
  await logVerificationAttempt(
    discordId,
    null, // robloxUsername
    data.ip,
    data.userAgent,
    action,
    details
  );
  
  console.log(`Discord verification: ${discordUsername} (${discordId}) - ${action}`);
}

async function handleRobloxLogin(data) {
  const { username, discordId, ip, userAgent } = data;
  
  await logVerificationAttempt(
    discordId,
    username,
    ip,
    userAgent,
    'webhook_received',
    'Credentials received via webhook'
  );
  
  console.log(`Roblox login webhook: ${username} for Discord ${discordId}`);
}

async function handleServerLink(data) {
  const { discordUserId, discordServerId, robloxUserId } = data;
  
  await query(
    `INSERT INTO server_links (discord_user_id, discord_server_id, roblox_user_id) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (discord_user_id, discord_server_id) 
     DO UPDATE SET roblox_user_id = EXCLUDED.roblox_user_id`,
    [discordUserId, discordServerId, robloxUserId]
  );
  
  console.log(`Server link: User ${discordUserId} linked to server ${discordServerId}`);
}
