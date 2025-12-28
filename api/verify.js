// This is a Vercel Serverless Function
// Location: /api/verify.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  try {
    const { discordId } = req.query;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID required' });
    }
    
    // Mock response - in real app, query database
    res.json({
      verified: false,
      message: 'No linked account found'
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { discordId, robloxId, robloxUsername, verificationToken } = req.body;
    
    if (!discordId || !robloxId || !robloxUsername) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Mock successful verification
    res.json({
      success: true,
      message: 'Account linked successfully',
      data: {
        discordId,
        robloxId,
        robloxUsername,
        verifiedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
