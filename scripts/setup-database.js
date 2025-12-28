require('dotenv').config();
const { initializeDatabase } = require('../src/api/db/schema.js');

async function setup() {
  try {
    console.log('🚀 Setting up Neon database...');
    
    await initializeDatabase();
    
    console.log('✅ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run your bot: npm start');
    console.log('2. Deploy to Vercel: vercel deploy');
    console.log('3. Configure environment variables in Vercel dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setup();
}

module.exports = { setup };
