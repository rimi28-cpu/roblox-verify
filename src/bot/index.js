require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Partials } = require('discord.js');
const { query } = require('../api/db/neon.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

// Verification channel ID
const VERIFY_CHANNEL_ID = process.env.DISCORD_VERIFY_CHANNEL_ID;

client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    // Register slash commands
    await registerCommands();
});

// When user joins server
client.on('guildMemberAdd', async (member) => {
    try {
        // Check if user is already verified
        const existing = await query(
            'SELECT * FROM linked_accounts WHERE discord_id = $1 AND is_verified = TRUE',
            [member.id]
        );
        
        if (existing.length > 0) {
            // User is already verified, assign roles
            await assignVerifiedRoles(member);
            return;
        }
        
        // Send verification message
        await sendVerificationMessage(member.user);
        console.log(`📩 Sent verification to new member: ${member.user.tag}`);
    } catch (error) {
        console.error('Failed to handle new member:', error);
    }
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, user, channel, member } = interaction;

    if (commandName === 'verify') {
        // Check if in correct channel
        if (channel.id !== VERIFY_CHANNEL_ID) {
            return interaction.reply({
                content: `Please use this command in the <#${VERIFY_CHANNEL_ID}> channel.`,
                ephemeral: true
            });
        }

        try {
            // Check if already verified
            const existing = await query(
                'SELECT * FROM linked_accounts WHERE discord_id = $1 AND is_verified = TRUE',
                [user.id]
            );
            
            if (existing.length > 0) {
                return interaction.reply({
                    content: `You are already verified as **${existing[0].roblox_username}**!`,
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
            const result = await query(
                `SELECT la.*, 
                 (SELECT COUNT(*) FROM server_links WHERE discord_user_id = $1) as server_count
                 FROM linked_accounts la 
                 WHERE la.discord_id = $1`,
                [user.id]
            );
            
            if (result.length === 0) {
                return interaction.reply({
                    content: 'You are not verified yet. Use `/verify` to get started!',
                    ephemeral: true
                });
            }
            
            const account = result[0];
            const embed = new EmbedBuilder()
                .setTitle('🔐 Verification Status')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Roblox Account', value: account.roblox_username, inline: true },
                    { name: 'Verified Since', value: new Date(account.linked_at).toLocaleDateString(), inline: true },
                    { name: 'Linked Servers', value: account.server_count.toString(), inline: true },
                    { name: 'Status', value: account.is_verified ? '✅ Verified' : '❌ Not Verified', inline: true }
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

    if (commandName === 'getrole') {
        try {
            // Check if user is verified
            const result = await query(
                'SELECT * FROM linked_accounts WHERE discord_id = $1 AND is_verified = TRUE',
                [user.id]
            );
            
            if (result.length === 0) {
                return interaction.reply({
                    content: 'You need to verify your account first! Use `/verify` to get started.',
                    ephemeral: true
                });
            }
            
            // Assign verified role
            const role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
            if (role) {
                await member.roles.add(role);
                await interaction.reply({
                    content: `✅ Successfully assigned the Verified role!`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'Verified role not found on this server.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Getrole command error:', error);
            await interaction.reply({
                content: 'Failed to assign role. Please contact an administrator.',
                ephemeral: true
            });
        }
    }
});

// Function to send verification embed
async function sendVerificationMessage(user) {
    const verificationToken = generateToken(user.id);
    const verificationLink = `${process.env.VERIFICATION_SITE_URL}/verify.html?token=${verificationToken}&discord_id=${user.id}`;

    // Store verification session in database
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await query(
        `INSERT INTO verification_sessions (discord_id, session_token, expires_at, status) 
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (discord_id) 
         DO UPDATE SET 
           session_token = EXCLUDED.session_token,
           expires_at = EXCLUDED.expires_at,
           status = 'pending'`,
        [user.id, verificationToken, expiresAt]
    );

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

// Helper functions
function generateToken(userId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    return `${token}_${timestamp}_${userId}`;
}

async function assignVerifiedRoles(member) {
    try {
        const role = member.guild.roles.cache.find(r => r.name === 'Verified');
        if (role) {
            await member.roles.add(role);
            console.log(`✅ Assigned Verified role to ${member.user.tag}`);
        }
    } catch (error) {
        console.error('Failed to assign roles:', error);
    }
}

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
        },
        {
            name: 'getrole',
            description: 'Get your verified roles after linking account'
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
