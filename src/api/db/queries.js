import { query } from './neon.js';

export async function createVerificationSession(discordId, token, expiresAt, ip) {
  return await query(
    `INSERT INTO verification_sessions (discord_id, session_token, expires_at, ip_address) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [discordId, token, expiresAt, ip]
  );
}

export async function getVerificationSession(token) {
  const result = await query(
    `SELECT * FROM verification_sessions 
     WHERE session_token = $1 AND expires_at > NOW() AND status = 'pending'`,
    [token]
  );
  return result[0];
}

export async function updateVerificationSession(token, status, robloxUsername = null) {
  return await query(
    `UPDATE verification_sessions 
     SET status = $1, roblox_username = $2 
     WHERE session_token = $3 
     RETURNING *`,
    [status, robloxUsername, token]
  );
}

export async function createLinkedAccount(discordId, discordUsername, robloxId, robloxUsername, token) {
  return await query(
    `INSERT INTO linked_accounts (discord_id, discord_username, roblox_id, roblox_username, verification_token, is_verified) 
     VALUES ($1, $2, $3, $4, $5, TRUE) 
     ON CONFLICT (discord_id) 
     DO UPDATE SET 
       roblox_id = EXCLUDED.roblox_id,
       roblox_username = EXCLUDED.roblox_username,
       verification_token = EXCLUDED.verification_token,
       is_verified = TRUE,
       last_updated = CURRENT_TIMESTAMP
     RETURNING *`,
    [discordId, discordUsername, robloxId, robloxUsername, token]
  );
}

export async function getLinkedAccountByDiscordId(discordId) {
  const result = await query(
    `SELECT * FROM linked_accounts WHERE discord_id = $1`,
    [discordId]
  );
  return result[0];
}

export async function getLinkedAccountByRobloxId(robloxId) {
  const result = await query(
    `SELECT * FROM linked_accounts WHERE roblox_id = $1`,
    [robloxId]
  );
  return result[0];
}

export async function linkServer(discordUserId, discordServerId, robloxUserId) {
  return await query(
    `INSERT INTO server_links (discord_user_id, discord_server_id, roblox_user_id) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (discord_user_id, discord_server_id) 
     DO UPDATE SET 
       roblox_user_id = EXCLUDED.roblox_user_id,
       linked_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [discordUserId, discordServerId, robloxUserId]
  );
}

export async function getUserServers(discordUserId) {
  return await query(
    `SELECT * FROM server_links WHERE discord_user_id = $1`,
    [discordUserId]
  );
}

export async function logVerificationAttempt(discordId, robloxUsername, ip, userAgent, status, details) {
  return await query(
    `INSERT INTO verification_logs (discord_id, roblox_username, ip_address, user_agent, status, details) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [discordId, robloxUsername, ip, userAgent, status, details]
  );
}

export async function cleanupExpiredSessions() {
  return await query(
    `DELETE FROM verification_sessions WHERE expires_at < NOW() - INTERVAL '7 days'`
  );
}

export async function getUserVerificationStatus(discordId) {
  const result = await query(
    `SELECT 
      la.*,
      COUNT(sl.id) as linked_servers_count,
      ARRAY_AGG(sl.discord_server_id) as server_ids
     FROM linked_accounts la
     LEFT JOIN server_links sl ON la.discord_id = sl.discord_user_id
     WHERE la.discord_id = $1
     GROUP BY la.id`,
    [discordId]
  );
  return result[0];
}
