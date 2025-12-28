require('dotenv').config();
const { deployCommands } = require('../src/bot/commands');

deployCommands().then(() => {
    console.log('Command deployment complete');
    process.exit(0);
}).catch(error => {
    console.error('Failed to deploy commands:', error);
    process.exit(1);
});
