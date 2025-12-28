require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Partials } = require('discord.js');
const db = require('./db.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

const VERIFY_CHANNEL_ID = process.env.DISCORD_VERIFY_CHANNEL_ID;

client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    // Register slash commands
    await registerCommands();
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

    const { commandName, user, channel, member } = interaction;

    if (commandName === 'verify') {
        if (channel.id !== VERIFY_CHANNEL_ID) {
            return interaction.reply({
                content: `Please use this command in the <#${VERIFY_CHANNEL_ID}> channel.`,
                ephemeral: true
            });
        }

        try {
            // Check if already verified
            const isVerified = await db.isVerified(user.id);
            if (isVerified) {
                const info = await db.getVerificationInfo(user.id);
                return interaction.reply({
                    content: `You are already verified as **${info.roblox_username}**!`,
                    ephemeral: true
                });
            }
            
            await sendVerificationMessage(user);
            await interaction.reply({
                content: 'Check your DMs for the verification link!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Verify command error:', error);
            await interaction.reply({
                content: 'Failed to send DM. Please make sure your DMs are open.',
                ephemeral: true
            });
        }
    }

    if (commandName === 'status') {
        try {
            const info = await db.getVerificationInfo(user.id);
            
            if (!info) {
                return interaction.reply({
                    content: 'You are not verified yet. Use `/verify` to get started!',
                    ephemeral: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🔐 Verification Status')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Roblox Account', value: info.roblox_username, inline: true },
                    { name: 'Roblox ID', value: info.roblox_id, inline: true },
                    { name: 'Verified Since', value: new Date(info.verified_at).toLocaleDateString(), inline: true }
                )
                .setFooter({ text: 'Bloxlink Verification' })
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Status command error:', error);
            await interaction.reply({
                content: 'Failed to fetch status. Please try again.',
                ephemeral: true
            });
        }
    }
});

// Send verification message
async function sendVerificationMessage(user) {
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store session in database
    await db.createSession(user.id, verificationToken);
    
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

// Register slash commands
async function registerCommands() {
    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
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
    
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);
process.on('unhandledRejection', console.error);

// Login
client.login(process.env.DISCORD_TOKEN);
