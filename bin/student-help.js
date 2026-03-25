#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';

// Get absolute path to the cli.js file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../cli.mjs');

// Dynamically import and run CLI
import(cliPath).catch(err => {
  console.error('Failed to load CLI:', err.message);
  process.exit(1);
});