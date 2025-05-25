import { generateServerKeyPair } from '../utils/crypto.js';

/**
 * Script to generate server RSA key pair for flagged message encryption
 * Run this once and add the keys to your environment variables
 */

try {
  console.log('Generating server RSA key pair...');
  const keyPair = generateServerKeyPair();
  
  console.log('\n=== SERVER KEY PAIR GENERATED ===\n');
  console.log('Add these to your .env file:\n');
  console.log(`SERVER_PUBLIC_KEY=${keyPair.publicKey}`);
  console.log(`SERVER_PRIVATE_KEY=${keyPair.privateKey}`);
  console.log('\n=== END ===\n');
  console.log('⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!');
  console.log('✅ After adding to .env, restart your server.');
  
} catch (error) {
  console.error('Error generating server key pair:', error);
  process.exit(1);
} 