import { spawn } from 'node:child_process';

/**
 * Namecheap cPanel ("Setup Node.js App" / Phusion Passenger) Startup Wrapper.
 * Set Application Startup File in cPanel to: server.mjs
 */
const child = spawn(
  process.execPath,
  ['./node_modules/tsx/dist/cli.mjs', 'src/server/main.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? 'production',
    },
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
