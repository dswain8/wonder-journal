import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'wonder-journal.db');
const db = new Database(dbPath, {
  timeout: 5000,
});

try {
  db.pragma('journal_mode = WAL');
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('database is locked')) {
    throw error;
  }
}

db.exec(`
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

db.exec(`
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

function ensureColumn(tableName: string, name: string, definition: string) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === name)) {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('duplicate column name')
      ) {
        throw error;
      }
    }
  }
}

ensureColumn('stories', 'fact_answer', 'TEXT');
ensureColumn('stories', 'narration_text', 'TEXT');
ensureColumn('stories', 'scene_tags', 'TEXT');
ensureColumn('stories', 'confidence', 'REAL');
ensureColumn('stories', 'answer_source', 'TEXT');
ensureColumn('stories', 'quality_score', 'REAL');
ensureColumn('story_cache', 'model', "TEXT NOT NULL DEFAULT 'unknown'");
ensureColumn('story_cache', 'prompt_version', "TEXT NOT NULL DEFAULT 'answer-v2'");

export default db;
