import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ECOSYSTEM_MAP, BRAND_MISSION } from "../nougen/ecosystem.js";
import { getSiteContext } from "../nougen/sites.js";
import { NOUGEN_Q_SPEC } from "../nougen/products.js";
import { HARDCADE_CONTEXT, VEILVERSE_CONTEXT } from "../nougen/worlds.js";
import { 
  GetSiteContextArgsSchema, 
  GenerateSiteMetadataArgsSchema, 
  GenerateBrandCopyArgsSchema,
  SaveBuildNoteArgsSchema,
  SearchBuildNotesArgsSchema,
  GetSmiStatusArgsSchema,
  NouGenContextModeArgsSchema,
  Dav1dExecBridgeArgsSchema
} from "./schemas.js";
import { saveBuildNote, searchBuildNotes } from "./db.js";
import { resolveContextPacket } from "../nougen/context_packet.js";
import { executeDav1dCommand } from "../nougen/dav1d_bridge.js";
import fs from "node:fs";
import path from "node:path";


export function registerTools(server: Server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "nougen_get_ecosystem_map",
          description: "Returns the current WhoVisions/NouGen ecosystem map.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "nougen_get_site_context",
          description: "Returns purpose, audience, brand role, and recommended next actions for a NouGen site.",
          inputSchema: zodToJsonSchema(GetSiteContextArgsSchema)
        },
        {
          name: "nougen_generate_site_metadata",
          description: "Generates SEO and social metadata suggestions based on site context.",
          inputSchema: zodToJsonSchema(GenerateSiteMetadataArgsSchema)
        },
        {
          name: "nougen_generate_brand_copy",
          description: "Generates brand-aligned copy for various page types.",
          inputSchema: zodToJsonSchema(GenerateBrandCopyArgsSchema)
        },
        {
          name: "nougen_get_nougen_q_spec",
          description: "Returns the NouGen Q product spec.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "nougen_get_hardcade_context",
          description: "Returns Hardcade framing.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "nougen_get_veilverse_context",
          description: "Returns VeilVerse framing.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "nougen_save_build_note",
          description: "Saves a build note to the local memory store.",
          inputSchema: zodToJsonSchema(SaveBuildNoteArgsSchema)
        },
        {
          name: "nougen_search_build_notes",
          description: "Searches local build notes using FTS5.",
          inputSchema: zodToJsonSchema(SearchBuildNotesArgsSchema)
        },
        {
          name: "nougen_get_smi_status",
          description: "Retrieves the current Strategic Memory Index (SMI) and Axial State from fleet transcripts.",
          inputSchema: zodToJsonSchema(GetSmiStatusArgsSchema)
        },
        {
          name: "nougen_context_mode",
          description: "Returns a deterministic, provenance-marked bounded context packet under the Scalpel First doctrine.",
          inputSchema: zodToJsonSchema(NouGenContextModeArgsSchema)
        },
        {
          name: "nougen_dav1d_exec",
          description: "Executes CLI commands via Dav1d bridge with strict hierarchical argv preservation and typed contract verification.",
          inputSchema: zodToJsonSchema(Dav1dExecBridgeArgsSchema)
        }
      ]

    };
  });


  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // ... existing tool handlers ...
      if (name === "nougen_get_smi_status") {
        const { limit } = GetSmiStatusArgsSchema.parse(args);
        try {
          const transcriptDir = process.env.NOUGEN_TRANSCRIPTS_DIR || "c:/Users/super/Watchtower/nougenai-next/.nougen/transcripts";
          let output = "";
          if (fs.existsSync(transcriptDir)) {
            const files = fs.readdirSync(transcriptDir).filter(f => f.endsWith('.txt')).sort();
            const filesToRead = files.slice(-Math.max(1, limit));
            output = filesToRead.map(f => fs.readFileSync(path.join(transcriptDir, f), "utf-8")).join("\n\n");
          }
          if (!output) output = "No transcripts found.";
          return { content: [{ type: "text", text: `Current Strategic Memory Index (SMI) Telemetry:\n\n${output}` }] };
        } catch (e: any) {
          return { content: [{ type: "text", text: `Failed to retrieve SMI status: ${e.message}` }], isError: true };
        }
      }
      
      if (name === "nougen_get_ecosystem_map") {
// ... rest of the handlers ...
        return { content: [{ type: "text", text: JSON.stringify(ECOSYSTEM_MAP, null, 2) }] };
      }

      if (name === "nougen_get_site_context") {
        const { site } = GetSiteContextArgsSchema.parse(args);
        const context = getSiteContext(site);
        if (!context) return { content: [{ type: "text", text: `Site context not found for: ${site}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(context, null, 2) }] };
      }

      if (name === "nougen_get_nougen_q_spec") {
        return { content: [{ type: "text", text: JSON.stringify(NOUGEN_Q_SPEC, null, 2) }] };
      }

      if (name === "nougen_get_hardcade_context") {
        return { content: [{ type: "text", text: JSON.stringify(HARDCADE_CONTEXT, null, 2) }] };
      }

      if (name === "nougen_get_veilverse_context") {
        return { content: [{ type: "text", text: JSON.stringify(VEILVERSE_CONTEXT, null, 2) }] };
      }

      if (name === "nougen_save_build_note") {
        const { title, body, tags, canon_link, agent_origin } = SaveBuildNoteArgsSchema.parse(args);
        
        // Forensic Defense: Scrub potential sensitive data (API keys, tokens, hex signatures)
        const scrubbedBody = body.replace(/(sk-[a-zA-Z0-9]{20,}|gho_[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9\-_]{30,}|[a-f0-9]{32})/gi, "[REDACTED_BY_FORENSIC_DEFENSE]");

        
        const note = { 
          id: Date.now().toString(), 
          title, 
          body: scrubbedBody, 
          tags: tags || [], 
          canon_link,
          agent_origin,
          timestamp: new Date().toISOString() 
        };
        
        saveBuildNote(note);
        return { content: [{ type: "text", text: `Successfully saved build note (Scribe Protocol active):\n${JSON.stringify(note, null, 2)}` }] };
      }


      if (name === "nougen_search_build_notes") {
        const { query } = SearchBuildNotesArgsSchema.parse(args);
        const results = searchBuildNotes(query);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      if (name === "nougen_generate_site_metadata") {
        const { site, purpose, audience } = GenerateSiteMetadataArgsSchema.parse(args);
        const context = getSiteContext(site);
        const siteRole = context?.role || "Digital Asset";
        
        const metadata = {
          title: `${site} | ${siteRole}`,
          description: `${BRAND_MISSION.mission} This page focuses on ${purpose} for ${audience}.`,
          keywords: [site, "NouGen AI", "Who Visions", siteRole, purpose].join(", "),
          openGraph: {
            title: `${site} - ${purpose}`,
            description: `Official ${site} portal. Part of the ${ECOSYSTEM_MAP.ai_umbrella} ecosystem.`,
            site_name: ECOSYSTEM_MAP.parent,
            type: "website"
          },
          twitter: {
            card: "summary_large_image",
            site: "@aiwithdav3"
          }
        };

        return { content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }] };
      }

      if (name === "nougen_generate_brand_copy") {
        const { brand, mode, audience, pageType } = GenerateBrandCopyArgsSchema.parse(args);
        
        const copy = {
          headline: `Transforming ${audience} through ${brand} Intelligence.`,
          subheadline: `A ${mode} approach to ${pageType} within the ${ECOSYSTEM_MAP.parent} ecosystem.`,
          body: `${BRAND_MISSION.mission} Our mission with ${brand} is to deliver ${mode} experiences tailored for ${audience}. ${BRAND_MISSION.positioning}`,
          cta: `Explore ${brand}`,
          vision_statement: BRAND_MISSION.slogan
        };

        return { content: [{ type: "text", text: JSON.stringify(copy, null, 2) }] };
      }

      if (name === "nougen_context_mode") {
        const parsed = NouGenContextModeArgsSchema.parse(args);
        const packet = await resolveContextPacket(parsed.query, {
          max_results: parsed.max_results,
          max_expansions: parsed.max_expansions,
          min_confidence: parsed.min_confidence,
          deadline_ms: parsed.deadline_ms,
          scope: parsed.scope
        });
        return { content: [{ type: "text", text: JSON.stringify(packet, null, 2) }] };
      }

      if (name === "nougen_dav1d_exec") {
        const parsed = Dav1dExecBridgeArgsSchema.parse(args);
        const receipt = executeDav1dCommand({
          binary: parsed.binary,
          subcommand: parsed.subcommand,
          args: parsed.args,
          cwd: parsed.cwd,
          timeout_ms: parsed.timeout_ms,
          request_id: parsed.request_id
        });
        return { content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }] };
      }

      throw new Error(`Tool not found: ${name}`);
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error executing tool ${name}: ${error.message}` }],
        isError: true
      };
    }
  });
}

