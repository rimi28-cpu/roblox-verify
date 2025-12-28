require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'verify',
        description: 'Get verification link to link your Roblox account'
    },
    {
        name: 'status',
        description: 'Check your verification status'
    }
];

async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🚀 Deploying slash commands...');
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands }
        );
        
        console.log('✅ Slash commands deployed successfully!');
    } catch (error) {
        console.error('❌ Failed to deploy commands:', error);
    }
}

deployCommands().then(() => {
    console.log('Command deployment complete');
    process.exit(0);
}).catch(error => {
    console.error('Failed to deploy commands:', error);
    process.exit(1);
});
