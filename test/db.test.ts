import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// Point the memory store at an isolated temp DB before importing db.ts,
// which opens the database at module-load time.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nougen-mcp-test-"));
process.env.NOUGEN_MEMORY_DB = path.join(tmpDir, "memory.sqlite");

const { saveBuildNote, searchBuildNotes } = await import("../src/mcp/db.ts");

test("save then search round-trips a note through the FTS5 index", () => {
  saveBuildNote({
    id: "note-1",
    title: "Lexical Recall",
    body: "Verified the lexical recall loop via SSE.",
    tags: ["test", "smoke"],
    timestamp: new Date().toISOString(),
  });

  const results = searchBuildNotes("lexical recall");
  const found = results.find((r) => r.id === "note-1");

  assert.ok(found, "expected the saved note to be returned by FTS5 search");
  assert.equal(found.title, "Lexical Recall");
  assert.deepEqual(found.tags, ["test", "smoke"], "tags should be parsed back into an array");
});

test("search tolerates punctuation without throwing an FTS5 syntax error", () => {
  saveBuildNote({
    id: "note-2",
    title: "Edge Case",
    body: "Handles quotes and (parens) safely.",
    tags: [],
    timestamp: new Date().toISOString(),
  });

  // A bare '(' is invalid FTS5 syntax unless the query is quoted; this must not throw.
  assert.doesNotThrow(() => searchBuildNotes("quotes and (parens)"));
});
