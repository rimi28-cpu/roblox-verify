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
    const { type, data } = req.body;
    
    switch (type) {
      case 'verification':
        await handleVerification(data);
        break;
        
      case 'server_link':
        await handleServerLink(data);
        break;
        
      default:
        console.log('Unknown webhook type:', type);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleVerification(data) {
  const { discordId, robloxUsername, action, details, ip } = data;
  
  await query(
    `INSERT INTO verification_logs (discord_id, roblox_username, ip_address, action, details) 
     VALUES ($1, $2, $3, $4, $5)`,
    [discordId, robloxUsername, ip, action, details]
  );
}

async function handleServerLink(data) {
  const { discordId, serverId, robloxId } = data;
  
  // Get current linked servers
  const result = await query(
    `SELECT linked_servers FROM linked_accounts WHERE discord_id = $1`,
    [discordId]
  );
  
  if (result.length > 0) {
    let linkedServers = result[0].linked_servers || [];
    if (!Array.isArray(linkedServers)) linkedServers = [];
    
    // Add server if not already linked
    if (!linkedServers.includes(serverId)) {
      linkedServers.push(serverId);
      
      await query(
        `UPDATE linked_accounts SET linked_servers = $1 WHERE discord_id = $2`,
        [JSON.stringify(linkedServers), discordId]
      );
    }
  }
}
