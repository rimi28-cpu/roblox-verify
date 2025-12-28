import { query } from './db/neon.js';
import { 
  getVerificationSession, 
  updateVerificationSession,
  createLinkedAccount,
  getUserVerificationStatus 
} from './db/queries.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discordId, robloxId, robloxUsername, verificationToken } = req.body;
    
    if (!discordId || !robloxId || !robloxUsername || !verificationToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the session token
    const session = await getVerificationSession(verificationToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired verification token' });
    }

    if (session.discord_id !== discordId) {
      return res.status(403).json({ error: 'Token does not match Discord user' });
    }

    // Update session status
    await updateVerificationSession(verificationToken, 'completed', robloxUsername);

    // Create or update linked account
    const linkedAccount = await createLinkedAccount(
      discordId,
      session.discord_username || `user_${discordId}`,
      robloxId,
      robloxUsername,
      verificationToken
    );

    // Get Discord user info (this would come from your bot)
    const discordUser = {
      username: `User_${discordId.substring(0, 8)}`,
      id: discordId
    };

    res.json({
      success: true,
      message: 'Account linked successfully',
      data: {
        discordUser,
        robloxAccount: {
          id: robloxId,
          username: robloxUsername
        },
        linkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET endpoint to check verification status
export async function getHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discordId } = req.query;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID required' });
    }

    const status = await getUserVerificationStatus(discordId);
    
    if (!status) {
      return res.json({
        verified: false,
        message: 'No linked account found'
      });
    }

    res.json({
      verified: status.is_verified,
      robloxUsername: status.roblox_username,
      linkedAt: status.linked_at,
      linkedServers: status.linked_servers_count || 0,
      serverIds: status.server_ids || []
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
