#!/usr/bin/env node
import { TOOLS } from "./tools/index.js";
import { listNetworks } from "./adapters/networks.js";
import { PAYMENT_CONFIG } from "./x402/pricing.js";

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function printStats(): void {
  const networks = listNetworks();
  const paidTools = TOOLS.filter((t) => !t.pricing.isFree);
  const freeTools = TOOLS.filter((t) => t.pricing.isFree);

  console.log(
    `\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}`,
  );
  console.log(
    `${BOLD}${CYAN}║           OpenScan MCP Server - Statistics                   ║${RESET}`,
  );
  console.log(
    `${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}\n`,
  );

  console.log(`${BOLD}Server Info${RESET}`);
  console.log(`${DIM}────────────────────────────────────────${RESET}`);
  console.log(`  Name:     openscan-mcp`);
  console.log(`  Version:  0.1.0`);
  console.log(`  Protocol: MCP (Model Context Protocol)`);
  console.log();

  console.log(`${BOLD}Networks (${networks.length})${RESET}`);
  console.log(`${DIM}────────────────────────────────────────${RESET}`);
  for (const network of networks) {
    console.log(`  ${GREEN}●${RESET} ${network.name} ${DIM}(Chain ID: ${network.chainId})${RESET}`);
  }
  console.log();

  console.log(`${BOLD}Payment Configuration${RESET}`);
  console.log(`${DIM}────────────────────────────────────────${RESET}`);
  console.log(`  Network:     ${PAYMENT_CONFIG.network} (Chain ID: ${PAYMENT_CONFIG.chainId})`);
  console.log(`  Token:       ${PAYMENT_CONFIG.token.symbol}`);
  console.log(`  Contract:    ${DIM}${PAYMENT_CONFIG.token.address}${RESET}`);
  console.log(`  Facilitator: ${DIM}${PAYMENT_CONFIG.facilitatorUrl}${RESET}`);
  console.log();

  console.log(`${BOLD}Tools (${TOOLS.length} total)${RESET}`);
  console.log(`${DIM}────────────────────────────────────────${RESET}`);

  console.log(`\n  ${YELLOW}Paid Tools (${paidTools.length})${RESET}`);
  for (const tool of paidTools) {
    const price = tool.pricing.price.padStart(6);
    console.log(`    ${price} USDC  ${tool.name}`);
  }

  console.log(`\n  ${GREEN}Free Tools (${freeTools.length})${RESET}`);
  for (const tool of freeTools) {
    console.log(`    ${GREEN}FREE${RESET}        ${tool.name}`);
  }

  console.log();
  console.log(`${DIM}Run with: npx openscan-mcp${RESET}`);
  console.log();
}

printStats();
