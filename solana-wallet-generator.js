const { Keypair } = require('@solana/web3.js');

// Generate new Solana wallet
const keypair = Keypair.generate();

console.log('=== NEW SOLANA WALLET GENERATED ===');
console.log('Public Key (Wallet Address):', keypair.publicKey.toString());
console.log('Private Key (Base58):', Buffer.from(keypair.secretKey).toString('base64'));
console.log('Private Key (Array):', Array.from(keypair.secretKey));

console.log('\n=== SEND SOL TO THIS ADDRESS ===');
console.log(keypair.publicKey.toString());

console.log('\n⚠️ SAVE YOUR PRIVATE KEY SECURELY! ⚠️');