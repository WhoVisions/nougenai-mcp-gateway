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
});

export const SearchBuildNotesArgsSchema = z.object({
  query: z.string().describe("FTS5 query string for searching build notes"),
});
