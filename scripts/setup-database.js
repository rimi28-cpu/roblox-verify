require('dotenv').config();
const { initDatabase } = require('../src/lib/database.js');

async function setup() {
  try {
    console.log('🚀 Setting up database schema...');
    
    await initDatabase();
    
    console.log('✅ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run your bot: npm start');
    console.log('2. Deploy to Vercel: vercel deploy');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setup();
