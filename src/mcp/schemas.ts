import { z } from "zod";

export const GetSiteContextArgsSchema = z.object({
  site: z.string().describe("Site name or domain (e.g., whovisions, aiwithdav3)"),
});

export const GenerateSiteMetadataArgsSchema = z.object({
  site: z.string().describe("Site name"),
  purpose: z.string().describe("Page purpose"),
  audience: z.string().describe("Target audience"),
});

export const GenerateBrandCopyArgsSchema = z.object({
  brand: z.string().describe("Brand name (e.g., NouGen AI, WhoVisions)"),
  mode: z.string().describe("Tone or mode (e.g., urgent, visionary)"),
  audience: z.string().describe("Target audience"),
  pageType: z.string().describe("Type of page (e.g., landing, about)"),
});

export const SaveBuildNoteArgsSchema = z.object({
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()).default([]),
  canon_link: z.enum([
    "Website Deployment",
    "Photography & Projects",
    "AI Experiments",
    "Social Media",
    "Brand Identity"
  ]).describe("The brand pillar this note associates with (Scribe Protocol)"),
  agent_origin: z.enum([
    "Rhea-Noir",
    "Iris-ai",
    "Kaedra",
    "Valerion",
    "Dav1d",
    "Yuki",
    "Blade",
    "Codex"
  ]).describe("The agent originating this note (Fleet Mesh ID)"),
});


export const SearchBuildNotesArgsSchema = z.object({
  query: z.string().describe("FTS5 query string for searching build notes"),
});

export const GetSmiStatusArgsSchema = z.object({
  limit: z.number().default(5).describe("Number of recent mission transcripts to retrieve"),
});

export const NouGenContextModeArgsSchema = z.object({
  query: z.string().describe("Natural-language context request or search terms"),
  max_results: z.number().optional().default(5).describe("Maximum items to retrieve"),
  max_expansions: z.number().optional().default(2).describe("Maximum progressive search scope expansions"),
  min_confidence: z.number().optional().default(0.7).describe("Sufficiency confidence threshold between 0.0 and 1.0"),
  deadline_ms: z.number().optional().default(5000).describe("Maximum search budget deadline in milliseconds"),
  scope: z.enum(["notes", "shards", "all"]).optional().default("all").describe("Search scope domain")
});

export const Dav1dExecBridgeArgsSchema = z.object({
  subcommand: z.string().optional().describe("Hierarchical subcommand (e.g. mcp, relay, shard)"),
  args: z.array(z.string()).default([]).describe("Command argument array"),
  binary: z.string().optional().default("agy").describe("Target binary name"),
  cwd: z.string().optional().describe("Execution working directory"),
  timeout_ms: z.number().optional().default(15000).describe("Execution timeout in milliseconds"),
  request_id: z.string().optional().describe("Correlation request ID")
});

export const NouGenMsgSearchArgsSchema = z.object({
  query: z.string().optional().describe("Search keywords in message text"),
  sender: z.string().optional().describe("Filter by sender or origin node"),
  target: z.string().optional().describe("Filter by target receiver"),
  limit: z.number().optional().default(10).describe("Maximum messages to return")
});

export const ShardsRecallArgsSchema = z.object({
  query: z.string().describe("Context or shard query"),
  limit: z.number().optional().default(5).describe("Maximum shards to retrieve")
});



