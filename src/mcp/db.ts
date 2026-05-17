import type Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Ensure data directory exists safely
const dataDir = path.join(process.cwd(), "data");
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.warn("[MCP DB] Could not create data directory, assuming read-only environment or existing structure.");
}

// Determine DB path
const dbPath = process.env.NOUGEN_MEMORY_DB || path.join(dataDir, "nougen_memory_v2.sqlite");

let SQLiteDB: any = null;
try {
  SQLiteDB = require("better-sqlite3");
} catch (err) {
  console.warn("[MCP DB] better-sqlite3 not available in this environment. Database operations will fail or need fallback.");
}

// Initialize database safely
export const db = SQLiteDB ? new SQLiteDB(dbPath, {
  // verbose: console.log
}) : {
  pragma: () => {},
  exec: () => {},
  prepare: () => ({ run: () => {}, all: () => [], get: () => null })
} as any;

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS build_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL,
      canon_link TEXT NOT NULL,
      agent_origin TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    -- FTS5 virtual table for semantic search
    CREATE VIRTUAL TABLE IF NOT EXISTS build_notes_fts USING fts5(
      title,
      body,
      tags,
      canon_link,
      agent_origin,
      content='build_notes',
      content_rowid='rowid'
    );

    -- Triggers to keep FTS table in sync
    CREATE TRIGGER IF NOT EXISTS build_notes_ai AFTER INSERT ON build_notes BEGIN
      INSERT INTO build_notes_fts(rowid, title, body, tags, canon_link, agent_origin) 
      VALUES (new.rowid, new.title, new.body, new.tags, new.canon_link, new.agent_origin);
    END;
    
    CREATE TRIGGER IF NOT EXISTS build_notes_ad AFTER DELETE ON build_notes BEGIN
      INSERT INTO build_notes_fts(build_notes_fts, rowid, title, body, tags, canon_link, agent_origin) 
      VALUES('delete', old.rowid, old.title, old.body, old.tags, old.canon_link, old.agent_origin);
    END;
    
    CREATE TRIGGER IF NOT EXISTS build_notes_au AFTER UPDATE ON build_notes BEGIN
      INSERT INTO build_notes_fts(build_notes_fts, rowid, title, body, tags, canon_link, agent_origin) 
      VALUES('delete', old.rowid, old.title, old.body, old.tags, old.canon_link, old.agent_origin);
      INSERT INTO build_notes_fts(rowid, title, body, tags, canon_link, agent_origin) 
      VALUES (new.rowid, new.title, new.body, new.tags, new.canon_link, new.agent_origin);
    END;
  `);
}

initDb();

export interface BuildNote {
  id: string;
  title: string;
  body: string;
  tags: string[];
  canon_link: string;
  agent_origin: string;
  timestamp: string;
}


export function saveBuildNote(note: BuildNote): void {
  const stmt = db.prepare(`
    INSERT INTO build_notes (id, title, body, tags, canon_link, agent_origin, timestamp)
    VALUES (@id, @title, @body, @tags, @canon_link, @agent_origin, @timestamp)
  `);
  
  stmt.run({
    id: note.id,
    title: note.title,
    body: note.body,
    tags: JSON.stringify(note.tags),
    canon_link: note.canon_link,
    agent_origin: note.agent_origin,
    timestamp: note.timestamp
  });
}


export function searchBuildNotes(query: string): BuildNote[] {
  const stmt = db.prepare(`
    SELECT * FROM build_notes 
    WHERE rowid IN (
      SELECT rowid FROM build_notes_fts WHERE build_notes_fts MATCH @query ORDER BY rank
    )
    LIMIT 8
  `);
  
  // Quote query to prevent FTS5 syntax errors on punctuation
  const safeQuery = `"${query.replace(/"/g, '""')}"`;
  
  const results = stmt.all({ query: safeQuery }) as any[];
  
  return results.map(r => ({
    ...r,
    tags: JSON.parse(r.tags)
  }));
}
