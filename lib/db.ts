import { createClient } from '@libsql/client';
import path from 'path';

// For local development, we default to the local file.
// For production on Vercel, you must set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'wonder-journal.db')}`;

const db = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      story_title TEXT NOT NULL,
      story_text TEXT NOT NULL,
      fact_answer TEXT,
      narration_text TEXT,
      wonder_question TEXT NOT NULL,
      image_path TEXT,
      image_category TEXT,
      scene_tags TEXT,
      confidence REAL,
      answer_source TEXT,
      quality_score REAL,
      child_name TEXT DEFAULT 'Anvita',
      child_age INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS story_cache (
      question_hash TEXT PRIMARY KEY,
      normalized_question TEXT NOT NULL,
      child_age INTEGER NOT NULL,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  async function ensureColumn(tableName: string, name: string, definition: string) {
    const rs = await db.execute(`PRAGMA table_info(${tableName})`);
    const columns = rs.rows;
    if (!columns.some((column) => column.name === name)) {
      try {
        await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
      } catch (error: any) {
        if (!error.message?.includes('duplicate column name')) {
          throw error;
        }
      }
    }
  }

  await ensureColumn('stories', 'fact_answer', 'TEXT');
  await ensureColumn('stories', 'narration_text', 'TEXT');
  await ensureColumn('stories', 'scene_tags', 'TEXT');
  await ensureColumn('stories', 'confidence', 'REAL');
  await ensureColumn('stories', 'answer_source', 'TEXT');
  await ensureColumn('stories', 'quality_score', 'REAL');
  await ensureColumn('story_cache', 'model', "TEXT NOT NULL DEFAULT 'unknown'");
  await ensureColumn('story_cache', 'prompt_version', "TEXT NOT NULL DEFAULT 'answer-v2'");
}

// Fire and forget initialization (safe for serverless as long as queries wait, though ideally should be part of a setup script)
initDb().catch(console.error);

export default db;
