/**
 * NouGenMsg Fleet Message Search & Ingestion Engine
 * 
 * Provides unified, multi-inbox query filtering and retrieval across:
 * - ~/.nougen/agy_inbox
 * - ~/.nougen/claude_inbox
 * - ~/.gemini/config/inbox
 * - ~/.codex/inbox
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface NouGenMessage {
  id: string;
  sender: string;
  target: string;
  text: string;
  timestamp: string;
  leg_id?: string;
  domain?: string;
  source_file: string;
}

export interface NouGenMsgSearchParams {
  query?: string;
  sender?: string;
  target?: string;
  limit?: number;
}

export interface NouGenMsgSearchResult {
  count: number;
  total_scanned: number;
  messages: NouGenMessage[];
}

export function searchNouGenMessages(params: NouGenMsgSearchParams = {}): NouGenMsgSearchResult {
  const limit = params.limit ?? 10;
  const query = (params.query || "").toLowerCase().trim();
  const senderFilter = (params.sender || "").toLowerCase().trim();
  const targetFilter = (params.target || "").toLowerCase().trim();

  const home = os.homedir();
  const inboxDirs = [
    path.join(home, ".nougen", "agy_inbox"),
    path.join(home, ".nougen", "claude_inbox"),
    path.join(home, ".gemini", "config", "inbox"),
    path.join(home, ".codex", "inbox")
  ];

  const messages: NouGenMessage[] = [];
  let totalScanned = 0;

  for (const inboxDir of inboxDirs) {
    if (!fs.existsSync(inboxDir)) continue;

    try {
      const files = fs.readdirSync(inboxDir).filter(f => f.endsWith(".json") && !f.startsWith("."));
      for (const file of files) {
        totalScanned++;
        const filePath = path.join(inboxDir, file);
        try {
          const raw = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(raw);
          
          const msgSender = String(data.sender || data.source || data.machine || "unknown");
          const msgTarget = String(data.target || "all");
          const msgText = String(data.text || data.message || data.content || data.goal || "");
          const msgTimestamp = data.timestamp 
            ? (typeof data.timestamp === "number" ? new Date(data.timestamp * 1000).toISOString() : String(data.timestamp))
            : fs.statSync(filePath).mtime.toISOString();
          
          // Apply filters
          if (senderFilter && !msgSender.toLowerCase().includes(senderFilter)) continue;
          if (targetFilter && !msgTarget.toLowerCase().includes(targetFilter)) continue;
          if (query && !msgText.toLowerCase().includes(query) && !msgSender.toLowerCase().includes(query)) continue;

          messages.push({
            id: String(data.message_id || data.id || file.replace(/\.json$/, "")),
            sender: msgSender,
            target: msgTarget,
            text: msgText,
            timestamp: msgTimestamp,
            leg_id: data.leg_id,
            domain: data.domain,
            source_file: filePath
          });
        } catch (err) {
          // Ignore corrupt single files
        }
      }
    } catch (dirErr) {
      // Ignore unreadable directory
    }
  }

  // Sort descending by timestamp
  messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    count: Math.min(messages.length, limit),
    total_scanned: totalScanned,
    messages: messages.slice(0, limit)
  };
}
