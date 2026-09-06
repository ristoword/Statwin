import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function normalizeDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  if (process.env.RAILWAY_ENVIRONMENT && !/[?&]sslmode=/.test(url)) {
    process.env.DATABASE_URL = `${url}${url.includes('?') ? '&' : '?'}sslmode=require`;
  }
}

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

async function waitForApi(url, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.warn(`API not ready at ${url}, starting web anyway`);
}

function spawnService(label, command, args, env, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  child.on('exit', (code) => {
    console.error(`${label} exited with ${code}`);
    process.exit(code ?? 1);
  });
  return child;
}

async function main() {
  process.env.NODE_ENV ||= 'production';
  normalizeDatabaseUrl();

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-production') {
    console.warn('JWT_SECRET is weak or missing. Set a long random value in Railway.');
  }

  await run('npx', ['prisma', 'migrate', 'deploy', '--schema=prisma/schema.prisma']);

  if (process.env.SEED_ON_BOOT !== 'false') {
    await run('npx', ['tsx', 'prisma/seed.ts']);
  }

  const apiPort = process.env.API_PORT ?? '3001';
  const webPort = process.env.PORT ?? '3000';
  const apiInternal = process.env.API_INTERNAL_URL ?? `http://127.0.0.1:${apiPort}`;

  spawnService('api', 'node', ['apps/api/dist/main.js'], {
    PORT: apiPort,
  });

  await waitForApi(`${apiInternal}/api/v1/health`);

  const standaloneServer = [
    path.join(root, 'apps/web/server.js'),
    path.join(root, 'server.js'),
  ].find((candidate) => existsSync(candidate));

  if (standaloneServer) {
    spawnService('web', 'node', [standaloneServer], {
      PORT: webPort,
      HOSTNAME: '0.0.0.0',
      API_INTERNAL_URL: apiInternal,
    });
  } else {
    spawnService(
      'web',
      'npx',
      ['next', 'start', '--port', webPort, '--hostname', '0.0.0.0'],
      {
        PORT: webPort,
        HOSTNAME: '0.0.0.0',
        API_INTERNAL_URL: apiInternal,
      },
      path.join(root, 'apps/web'),
    );
  }

  console.log(`STATWIN web  http://0.0.0.0:${webPort}`);
  console.log(`STATWIN api  ${apiInternal}/api/v1`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
