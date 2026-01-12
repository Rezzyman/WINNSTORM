import 'dotenv/config';
import { db } from '../server/db';
import { adminCredentials } from '../shared/schema';

async function checkCredentials() {
  const creds = await db.select().from(adminCredentials);
  console.log('Admin credentials in database:');
  if (creds.length === 0) {
    console.log('No admin credentials found!');
  } else {
    creds.forEach(c => {
      console.log('- Email:', c.email);
      console.log('  Has password hash:', c.passwordHash ? 'Yes' : 'No');
    });
  }
}

checkCredentials().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
