import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });
  const db = drizzle(client);

  console.log('Running migrations…');
  await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
  console.log('Migrations complete.');
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
