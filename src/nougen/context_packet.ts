/**
 * NouGen Context Mode — Scalpel First Bounded Context Packet Primitive
 * 
 * Implements the Standing Doctrine (shard 30476@db2 & 30477@db2):
 * 1. Start with smallest operation capable of answering (exact target -> smallest scope -> lowest fanout).
 * 2. Progressive deterministic single-dimension expansion only on evidence of insufficiency.
 * 3. Bounded budget: max results, expansions, latency deadline.
 * 4. Deterministic provenance tuples: (source, id, hash, timestamp, confidence).
 */

import { searchBuildNotes, BuildNote } from "../mcp/db.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface ProvenanceTuple {
  source: string;
  id: string;
  hash: string;
  timestamp: string;
  confidence: number;
}

export interface ContextPacket {
  query: string;
  coverage_sufficient: boolean;
  confidence: number;
  retrieval_count: number;
  fanout: number;
  expansions_used: number;
  budget_exhausted: boolean;
  latency_ms: number;
  provenance: ProvenanceTuple[];
  summary: string;
  items: Array<{
    id: string;
    title: string;
    body: string;
    source: string;
    score: number;
  }>;
}

export interface ContextPacketOptions {
  max_results?: number;
  max_expansions?: number;
  min_confidence?: number;
  deadline_ms?: number;
  scope?: "notes" | "shards" | "all";
}

export async function resolveContextPacket(
  query: string,
  options: ContextPacketOptions = {}
): Promise<ContextPacket> {
  const startTime = Date.now();
  const maxResults = options.max_results ?? 5;
  const maxExpansions = options.max_expansions ?? 2;
  const minConfidence = options.min_confidence ?? 0.7;
  const deadlineMs = options.deadline_ms ?? 5000;
  const scope = options.scope ?? "all";

  const provenance: ProvenanceTuple[] = [];
  const items: ContextPacket["items"] = [];
  let expansionsUsed = 0;
  let fanout = 1;
  let budgetExhausted = false;

  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return {
      query,
      coverage_sufficient: false,
      confidence: 0,
      retrieval_count: 0,
      fanout: 0,
      expansions_used: 0,
      budget_exhausted: false,
      latency_ms: Date.now() - startTime,
      provenance: [],
      summary: "Empty query provided.",
      items: []
    };
  }

  // --- STAGE 1: Scalpel Exact Match Probe (Cheapest / Narrowest) ---
  const exactHits = searchBuildNotes(sanitizedQuery);
  for (const note of exactHits.slice(0, maxResults)) {
    const hash = crypto.createHash("sha256").update(note.body).digest("hex").slice(0, 16);
    provenance.push({
      source: "build_notes:fts5",
      id: note.id,
      hash,
      timestamp: note.timestamp,
      confidence: 0.95
    });
    items.push({
      id: note.id,
      title: note.title,
      body: note.body,
      source: "build_notes",
      score: 0.95
    });
  }

  // --- STAGE 2: Progressive Expansion Only If Insufficient ---
  const stage1Sufficient = items.length > 0 && items.some(it => it.score >= minConfidence);
  if (!stage1Sufficient && expansionsUsed < maxExpansions && scope !== "notes") {
    // Expand 1: Local vault markdown shards search
    expansionsUsed++;
    fanout++;

    const vaultDirs = [
      "C:\\Users\\super\\Watchtower\\vault",
      path.join(process.cwd(), "vault"),
      path.join(process.cwd(), "data")
    ];

    for (const vDir of vaultDirs) {
      if (Date.now() - startTime > deadlineMs) {
        budgetExhausted = true;
        break;
      }
      if (!fs.existsSync(vDir)) continue;

      try {
        const files = fs.readdirSync(vDir).filter(f => f.endsWith(".md") || f.endsWith(".json"));
        for (const file of files) {
          if (items.length >= maxResults) break;
          const fullPath = path.join(vDir, file);
          const content = fs.readFileSync(fullPath, "utf8");
          
          // Case-insensitive token match
          const queryTokens = sanitizedQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
          const matches = queryTokens.filter(t => content.toLowerCase().includes(t));
          
          if (matches.length > 0) {
            const score = matches.length / queryTokens.length;
            if (score >= 0.5) {
              const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
              provenance.push({
                source: `vault:${file}`,
                id: file,
                hash,
                timestamp: fs.statSync(fullPath).mtime.toISOString(),
                confidence: Number(score.toFixed(2))
              });
              items.push({
                id: file,
                title: file.replace(/\.(md|json)$/, ""),
                body: content.slice(0, 500) + (content.length > 500 ? "..." : ""),
                source: "vault_file",
                score: Number(score.toFixed(2))
              });
            }
          }
        }
      } catch (e) {
        // Safe isolation
      }
    }
  }

  const topConfidence = items.length > 0
    ? Math.max(...items.map(it => it.score))
    : 0;

  const coverageSufficient = items.length > 0 && topConfidence >= minConfidence;
  const latencyMs = Date.now() - startTime;

  let summary = `Retrieved ${items.length} relevant context item(s) across ${fanout} search scope(s).`;
  if (!coverageSufficient) {
    summary += " Note: Results did not fully meet confidence threshold or were sparse.";
  }

  return {
    query: sanitizedQuery,
    coverage_sufficient: coverageSufficient,
    confidence: Number(topConfidence.toFixed(2)),
    retrieval_count: items.length,
    fanout,
    expansions_used: expansionsUsed,
    budget_exhausted: budgetExhausted,
    latency_ms: latencyMs,
    provenance,
    summary,
    items
  };

}
