import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = join(root, 'data', 'postgres');
mkdirSync(databaseDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'statwin',
  password: 'statwin_secret',
  port: 5432,
  persistent: true,
  onLog: (message) => process.stdout.write(String(message)),
  onError: (message) => process.stderr.write(String(message)),
});

await pg.initialise();
await pg.start();

try {
  await pg.createDatabase('statwin');
  console.log('Database statwin created');
} catch (error) {
  const text = String(error);
  if (!text.includes('already exists')) {
    throw error;
  }
  console.log('Database statwin already exists');
}

console.log('PostgreSQL embedded on localhost:5432 (user=statwin db=statwin)');
console.log('Keep this process running. Ctrl+C to stop.');
