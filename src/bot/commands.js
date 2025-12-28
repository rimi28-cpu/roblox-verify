const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'verify',
        description: 'Get verification link to link your Roblox account'
    },
    {
        name: 'sendverify',
        description: 'Admin: Send verification DM to user',
        options: [
            {
                name: 'user',
                type: 6, // USER type
                description: 'User to send verification to',
                required: true
            }
        ]
    },
    {
        name: 'getrole',
        description: 'Get your verified roles after linking account'
    },
    {
        name: 'status',
        description: 'Check your verification status'
    }
];

async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Deploying slash commands...');
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands }
        );
        
        console.log('✅ Slash commands deployed successfully!');
    } catch (error) {
        console.error('Failed to deploy commands:', error);
    }
}

module.exports = { commands, deployCommands };
