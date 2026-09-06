import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INIT_MIGRATION = '20260306000000_init';

export function run(command, args) {
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

export async function ensureDatabase() {
  try {
    await run('npx', ['prisma', 'migrate', 'deploy', '--schema=prisma/schema.prisma']);
    return;
  } catch (error) {
    console.warn('prisma migrate deploy failed; clearing failed migration and syncing schema.');
    console.warn(error.message);
  }

  try {
    await run('npx', [
      'prisma',
      'migrate',
      'resolve',
      '--rolled-back',
      INIT_MIGRATION,
      '--schema=prisma/schema.prisma',
    ]);
  } catch {
    /* already resolved or table missing */
  }

  await run('npx', ['prisma', 'db', 'push', '--schema=prisma/schema.prisma', '--skip-generate']);
}
