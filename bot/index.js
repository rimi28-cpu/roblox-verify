require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ]
});

const VERIFY_CHANNEL_ID = process.env.DISCORD_VERIFY_CHANNEL_ID;

client.once('ready', () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// When user joins
client.on('guildMemberAdd', async (member) => {
    try {
        await sendVerificationMessage(member.user);
        console.log(`📩 Sent verification to new member: ${member.user.tag}`);
    } catch (error) {
        console.error('Failed to send verification:', error);
    }
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'verify') {
        const { user, channel } = interaction;
        
        // Check if in correct channel
        if (channel.id !== VERIFY_CHANNEL_ID) {
            return interaction.reply({
                content: `Please use this command in the <#${VERIFY_CHANNEL_ID}> channel.`,
                ephemeral: true
            });
        }

        try {
            await sendVerificationMessage(user);
            await interaction.reply({
                content: 'Check your DMs for the verification link!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Failed to send DM:', error);
            await interaction.reply({
                content: 'Failed to send DM. Please make sure your DMs are open.',
                ephemeral: true
            });
        }
    }
});

// Send verification message
async function sendVerificationMessage(user) {
    const verificationToken = generateToken(user.id);
    const verificationLink = `${process.env.BASE_URL}/verify.html?token=${verificationToken}&discord_id=${user.id}`;

    const embed = new EmbedBuilder()
        .setTitle('🔐 Verify Your Roblox Account')
        .setDescription('Click the button below to verify your Roblox account and link it to Discord.')
        .setColor(0x5865F2)
        .addFields(
            { name: 'Steps', value: '1. Click "Verify Account"\n2. Login with Roblox\n3. Select Discord servers\n4. Get verified!' }
        )
        .setFooter({ text: 'Link expires in 15 minutes' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Verify Account')
                .setURL(verificationLink)
                .setStyle(ButtonStyle.Link)
        );

    try {
        await user.send({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error(`Could not send DM to ${user.tag}:`, error);
        throw error;
    }
}

function generateToken(userId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    return `${token}_${timestamp}_${userId}`;
}

// Register slash commands
client.once('ready', async () => {
    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    const commands = [
        {
            name: 'verify',
            description: 'Get verification link to link your Roblox account'
        }
    ];
    
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
});

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// Login
client.login(process.env.DISCORD_TOKEN);
