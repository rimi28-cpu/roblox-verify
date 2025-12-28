// Simple verification endpoint for checking status
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // Check verification status
    const { discordId } = req.query;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID required' });
    }
    
    // For demo purposes, return mock data
    res.json({
      verified: false,
      message: 'Verification endpoint is working'
    });
  }
  
  if (req.method === 'POST') {
    // Complete verification
    const { discordId, robloxId, robloxUsername } = req.body;
    
    if (!discordId || !robloxId || !robloxUsername) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For demo purposes
    res.json({
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
}
