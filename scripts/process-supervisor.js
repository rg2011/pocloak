#!/usr/bin/env node

const { spawn } = require('node:child_process');

const entrypoint = ['src/server/server.js'];
const restartDelayMs = 1000;
let child = null;
let stopping = false;

function startChild() {
  child = spawn(process.execPath, entrypoint, {
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code, signal) => {
    if (stopping) {
      process.exit(0);
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.info(`[runner] app exited (${reason}). Restarting in ${restartDelayMs}ms...`);
    setTimeout(startChild, restartDelayMs);
  });
}

function stopRunner(signal) {
  stopping = true;

  if (!child) {
    process.exit(0);
  }

  if (child && !child.killed) {
    child.kill(signal);
  }
}

process.on('SIGINT', () => stopRunner('SIGINT'));
process.on('SIGTERM', () => stopRunner('SIGTERM'));

startChild();
