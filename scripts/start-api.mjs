import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function main() {
  if (process.env.DATABASE_URL && process.env.RAILWAY_ENVIRONMENT && !/[?&]sslmode=/.test(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL += `${process.env.DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`;
  }

  await run('npx', ['prisma', 'migrate', 'deploy', '--schema=prisma/schema.prisma']);
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
