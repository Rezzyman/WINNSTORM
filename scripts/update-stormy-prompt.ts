import 'dotenv/config';
import { db } from '../server/db';
import { systemSettings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updatePrompt() {
  const promptPath = join(__dirname, 'stormy-prompt.txt');
  const STORMY_PROMPT = readFileSync(promptPath, 'utf-8');

  // Check if exists
  const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.key, 'stormy_system_prompt'));

  if (existing) {
    const [updated] = await db.update(systemSettings)
      .set({
        value: STORMY_PROMPT,
        updatedAt: new Date(),
        updatedBy: 'admin@winnstorm.com',
        description: 'Master Agent Prompt - Internal System Instructions'
      })
      .where(eq(systemSettings.key, 'stormy_system_prompt'))
      .returning();
    console.log('Updated Stormy prompt. ID:', updated.id, 'Length:', updated.value.length, 'chars');
  } else {
    const [created] = await db.insert(systemSettings).values({
      key: 'stormy_system_prompt',
      value: STORMY_PROMPT,
      description: 'Master Agent Prompt - Internal System Instructions',
      updatedBy: 'admin@winnstorm.com'
    }).returning();
    console.log('Created Stormy prompt. ID:', created.id, 'Length:', created.value.length, 'chars');
  }
}

updatePrompt().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
