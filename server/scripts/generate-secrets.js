#!/usr/bin/env node

/**
 * Security Utilities
 * Generates secure random strings for passwords and JWT secrets
 */

const crypto = require('crypto');

function generateSecureString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function generatePassword(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function displayHelp() {
  console.log('');
  console.log('🔒 Security Utilities for Yourtown Delivery');
  console.log('==========================================');
  console.log('');
  console.log('Usage:');
  console.log('  node generate-secrets.js [option]');
  console.log('');
  console.log('Options:');
  console.log('  jwt       Generate a JWT secret (128 chars)');
  console.log('  password  Generate a secure password (32 chars)');
  console.log('  all       Generate both (default)');
  console.log('  help      Show this help message');
  console.log('');
}

const arg = process.argv[2] || 'all';

switch(arg.toLowerCase()) {
  case 'jwt':
    console.log('');
    console.log('🔑 JWT Secret:');
    console.log('==================================================');
    console.log(generateJWTSecret());
    console.log('==================================================');
    console.log('');
    console.log('Add to your .env file as:');
    console.log(`JWT_SECRET=${generateJWTSecret()}`);
    console.log('');
    break;

  case 'password':
    console.log('');
    console.log('🔐 Secure Password:');
    console.log('==================================================');
    console.log(generatePassword());
    console.log('==================================================');
    console.log('');
    break;

  case 'all':
    console.log('');
    console.log('🔒 Security Secrets Generated');
    console.log('==================================================');
    console.log('');
    console.log('🔑 JWT Secret (add to .env):');
    console.log('---');
    const jwtSecret = generateJWTSecret();
    console.log(jwtSecret);
    console.log('');
    console.log('Copy this to your .env file:');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log('');
    console.log('---');
    console.log('');
    console.log('🔐 Admin Password (store securely):');
    console.log('---');
    console.log(generatePassword());
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('- Store these values securely');
    console.log('- Never commit them to version control');
    console.log('- Do not share them publicly');
    console.log('');
    console.log('==================================================');
    console.log('');
    break;

  case 'help':
  case '--help':
  case '-h':
    displayHelp();
    break;

  default:
    console.log(`Unknown option: ${arg}`);
    displayHelp();
    process.exit(1);
}
