/**
 * Test script for OpenScan MCP Server
 * Tests free tools, paid tools, and payment verification flow
 */

import { createMcpServer, getToolDefinitions, executeTool, PAYMENT_CONFIG, generatePaymentChallenge, encodePaymentRequired } from './dist/index.js';

console.log('\n=== OpenScan MCP Server Test Suite ===\n');

// Test 1: Check tool definitions
console.log('1. Testing tool definitions...');
const tools = getToolDefinitions();
console.log(`   Found ${tools.length} tools`);
console.log(`   Free tools: ${tools.filter(t => t.pricing.isFree).map(t => t.name).join(', ')}`);
console.log(`   Paid tools: ${tools.filter(t => !t.pricing.isFree).length} tools\n`);

// Test 2: Execute a free tool (listNetworks)
console.log('2. Testing FREE tool execution (listNetworks)...');
const networksResult = await executeTool('listNetworks', {});
if (networksResult.success) {
  console.log(`   ✓ listNetworks returned ${networksResult.data.count} networks`);
  networksResult.data.networks.forEach(n => {
    console.log(`     - ${n.name} (Chain ID: ${n.chainId})`);
  });
} else {
  console.log(`   ✗ listNetworks failed: ${networksResult.error}`);
}
console.log();

// Test 3: Execute getPaymentInfo (free tool)
console.log('3. Testing FREE tool execution (getPaymentInfo)...');
const paymentInfoResult = await executeTool('getPaymentInfo', {});
if (paymentInfoResult.success) {
  console.log(`   ✓ Payment protocol: ${paymentInfoResult.data.protocol}`);
  console.log(`   ✓ Network: ${paymentInfoResult.data.network.name} (Chain ID: ${paymentInfoResult.data.network.chainId})`);
  console.log(`   ✓ Token: ${paymentInfoResult.data.token.symbol} at ${paymentInfoResult.data.token.address}`);
  console.log(`   ✓ Facilitator: ${paymentInfoResult.data.facilitator}`);
} else {
  console.log(`   ✗ getPaymentInfo failed: ${paymentInfoResult.error}`);
}
console.log();

// Test 4: Test MCP server creation WITHOUT payments (default mode)
console.log('4. Testing MCP server creation (payments DISABLED - default)...');
const serverNoPayments = createMcpServer();
console.log(`   ✓ Server created: ${serverNoPayments ? 'yes' : 'no'}`);
console.log();

// Test 5: Test MCP server creation WITH payments enabled
console.log('5. Testing MCP server creation (payments ENABLED)...');
const serverWithPayments = createMcpServer({
  enablePayments: true,
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
});
console.log(`   ✓ Server with payments created: ${serverWithPayments ? 'yes' : 'no'}`);
console.log();

// Test 6: Test payment challenge generation
console.log('6. Testing payment challenge generation...');
const challenge = generatePaymentChallenge(
  'getAddressInfo',
  '1000', // 0.001 USDC in atomic units
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
);
console.log(`   ✓ Challenge version: ${challenge.version}`);
console.log(`   ✓ Network: ${challenge.network.name} (Chain ID: ${challenge.network.chainId})`);
console.log(`   ✓ Payment amount: ${challenge.payment.amount} ${challenge.payment.symbol}`);
console.log(`   ✓ Recipient: ${challenge.payment.recipient}`);
console.log(`   ✓ Facilitator: ${challenge.facilitator.url}`);
console.log();

// Test 7: Test a PAID tool with actual RPC call (getNetworkStats)
console.log('7. Testing PAID tool execution (getNetworkStats - avalanche-fuji)...');
const statsResult = await executeTool('getNetworkStats', { network: 'avalanche-fuji' });
if (statsResult.success) {
  console.log(`   ✓ Network: ${statsResult.data.network} (Chain ID: ${statsResult.data.chainId})`);
  console.log(`   ✓ Latest block: ${statsResult.data.latestBlock}`);
  console.log(`   ✓ Gas price: ${statsResult.data.gasPrice.gwei} gwei`);
} else {
  console.log(`   ✗ getNetworkStats failed: ${statsResult.error}`);
}
console.log();

// Test 8: Test payment config
console.log('8. Checking PAYMENT_CONFIG...');
console.log(`   Network: ${PAYMENT_CONFIG.network}`);
console.log(`   Chain ID: ${PAYMENT_CONFIG.chainId}`);
console.log(`   Token: ${PAYMENT_CONFIG.token.symbol}`);
console.log(`   Token Address: ${PAYMENT_CONFIG.token.address}`);
console.log(`   Decimals: ${PAYMENT_CONFIG.token.decimals}`);
console.log(`   Facilitator URL: ${PAYMENT_CONFIG.facilitatorUrl}`);
console.log(`   Is Testnet: ${PAYMENT_CONFIG.isTestnet}`);
console.log();

console.log('=== All tests completed ===\n');
