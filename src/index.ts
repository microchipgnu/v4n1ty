#!/usr/bin/env node

import { CLI } from './cli.js';

/**
 * Main entry point for the vanity address generator CLI
 */
async function main(): Promise<void> {
  const cli = new CLI();
  await cli.execute(process.argv);
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 