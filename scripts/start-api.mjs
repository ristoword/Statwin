import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDatabase, run } from './ensure-db.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  if (process.env.DATABASE_URL && process.env.RAILWAY_ENVIRONMENT && !/[?&]sslmode=/.test(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL += `${process.env.DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`;
  }

  await ensureDatabase();
  if (process.env.SEED_ON_BOOT !== 'false') {
    await run('npx', ['tsx', 'prisma/seed.ts']);
  }

  const child = spawn('node', ['apps/api/dist/main.js'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
