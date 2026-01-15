import pg from 'pg';
import 'dotenv/config';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addColumns() {
  await client.connect();
  console.log('Connected to database');

  const columns = [
    { name: 'stripe_customer_id', type: 'TEXT' },
    { name: 'subscription_id', type: 'TEXT' },
    { name: 'subscription_status', type: 'TEXT' },
    { name: 'subscription_tier', type: 'TEXT' },
    { name: 'current_period_end', type: 'TIMESTAMP' }
  ];

  for (const col of columns) {
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`✓ Added column: ${col.name}`);
    } catch (err: any) {
      if (err.code === '42701') {
        console.log(`• Column ${col.name} already exists`);
      } else {
        console.error(`✗ Error adding ${col.name}:`, err.message);
      }
    }
  }

  await client.end();
  console.log('\nMigration complete!');
}

addColumns().catch(console.error);
