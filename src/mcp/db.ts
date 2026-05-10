import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Determine DB path
const dbPath = process.env.NOUGEN_MEMORY_DB || path.join(dataDir, "nougen_memory.sqlite");

// Initialize database
export const db = new Database(dbPath, {
  // verbose: console.log
});

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS build_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    -- FTS5 virtual table for semantic search
    CREATE VIRTUAL TABLE IF NOT EXISTS build_notes_fts USING fts5(
      title,
      body,
      tags,
      content='build_notes',
      content_rowid='rowid'
    );

    -- Triggers to keep FTS table in sync
    CREATE TRIGGER IF NOT EXISTS build_notes_ai AFTER INSERT ON build_notes BEGIN
      INSERT INTO build_notes_fts(rowid, title, body, tags) VALUES (new.rowid, new.title, new.body, new.tags);
    END;
    
    CREATE TRIGGER IF NOT EXISTS build_notes_ad AFTER DELETE ON build_notes BEGIN
      INSERT INTO build_notes_fts(build_notes_fts, rowid, title, body, tags) VALUES('delete', old.rowid, old.title, old.body, old.tags);
    END;
    
    CREATE TRIGGER IF NOT EXISTS build_notes_au AFTER UPDATE ON build_notes BEGIN
      INSERT INTO build_notes_fts(build_notes_fts, rowid, title, body, tags) VALUES('delete', old.rowid, old.title, old.body, old.tags);
      INSERT INTO build_notes_fts(rowid, title, body, tags) VALUES (new.rowid, new.title, new.body, new.tags);
    END;
  `);
}

initDb();

export interface BuildNote {
  id: string;
  title: string;
  body: string;
  tags: string[];
  timestamp: string;
}

export function saveBuildNote(note: BuildNote): void {
  const stmt = db.prepare(`
    INSERT INTO build_notes (id, title, body, tags, timestamp)
    VALUES (@id, @title, @body, @tags, @timestamp)
  `);
  
  stmt.run({
    id: note.id,
    title: note.title,
    body: note.body,
    tags: JSON.stringify(note.tags),
    timestamp: note.timestamp
  });
}

export function searchBuildNotes(query: string): BuildNote[] {
  const stmt = db.prepare(`
    SELECT * FROM build_notes 
    WHERE rowid IN (
      SELECT rowid FROM build_notes_fts WHERE build_notes_fts MATCH @query ORDER BY rank
    )
    LIMIT 20
  `);
  
  // Quote query to prevent FTS5 syntax errors on punctuation
  const safeQuery = `"${query.replace(/"/g, '""')}"`;
  
  const results = stmt.all({ query: safeQuery }) as any[];
  
  return results.map(r => ({
    ...r,
    tags: JSON.parse(r.tags)
  }));
}
