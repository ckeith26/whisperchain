#!/usr/bin/env node

import checkAndSetupAdmin from '../utils/adminSetup';

async function runSetup() {
  try {
    console.log('Running admin setup utility...');
    await checkAndSetupAdmin();
    console.log('Admin setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error running admin setup:', error);
    process.exit(1);
  }
}

runSetup(); 