const { Client } = require('pg');
const client = new Client({
  host: 'db.spb-6uukrzky061ha9nw.supabase.opentrust.net',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Hz0l4C1dBFvFaG2',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  client.connect();
  
  const result = await client.query('SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = $1)', ['app_role']);
  console.log('app_role exists:', result.rows[0].exists);
  
  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
