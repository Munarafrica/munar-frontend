import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });

async function main() {
  const r = await sql`SELECT t.id, t.name, t.status, t.visibility, t.event_id, e.slug as event_slug FROM tickets t JOIN events e ON t.event_id = e.id`;
  console.log(JSON.stringify(r, null, 2));
  await sql.end();
}
main();
