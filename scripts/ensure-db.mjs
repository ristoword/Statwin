import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
    console.warn(
      'prisma migrate deploy failed; syncing schema with a non-destructive db push. Users are not reset.',
    );
    console.warn(error.message);
  }

  // Intentionally no `migrate resolve --rolled-back` and no `migrate reset`.
  // Those made Prisma treat the database as empty and dropped client accounts.

  await run('npx', ['prisma', 'db', 'push', '--schema=prisma/schema.prisma', '--skip-generate']);
}
