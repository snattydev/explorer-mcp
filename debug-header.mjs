import { parseX402Header } from './dist/index.js';

// Test the exact payload from comprehensive test
const headerPayload = {
  x402Version: 1,
  scheme: 'exact',
  network: 'base-sepolia',
  payload: {
    signature: '0x1234567890abcdef',
    authorization: {
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '1000',
      chainId: 84532,
      token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    }
  }
};

const base64Header = `x402 ${Buffer.from(JSON.stringify(headerPayload)).toString('base64')}`;
console.log('Input header:', base64Header.substring(0, 100) + '...');

const parsed = parseX402Header(base64Header);
console.log('\nParsed result:', JSON.stringify(parsed, null, 2));

// Check what's failing
if (!parsed) {
  console.log('\nDEBUG: Parsing failed. Testing components...');
  
  const parts = base64Header.split(' ');
  console.log('Parts[0]:', parts[0]);
  console.log('Parts[1] exists:', !!parts[1]);
  
  try {
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    console.log('Decoded JSON:', Object.keys(decoded));
    console.log('Has signature:', !!decoded.signature);
    console.log('Signature value:', decoded.signature);
  } catch (e) {
    console.log('Error during decode:', e.message);
  }
}
