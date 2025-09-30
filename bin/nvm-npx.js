#!/usr/bin/env node

const { runCli } = require('../src/run-cli');

runCli({
  argv: process.argv.slice(2),
  invokerPath: process.argv[1],
  defaultCommand: 'npx',
});
