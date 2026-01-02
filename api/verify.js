export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    const { discordId } = req.query;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID required' });
    }
    
    return res.json({
      verified: false,
      message: 'Verification endpoint is working'
    });
  }
  
  if (req.method === 'POST') {
    const { discordId, robloxId, robloxUsername } = req.body;
    
    if (!discordId || !robloxId || !robloxUsername) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    return res.json({
      success: true,
      message: 'Account linked successfully',
      data: {
        discordId,
        robloxId,
        robloxUsername,
        linkedAt: new Date().toISOString()
      }
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
