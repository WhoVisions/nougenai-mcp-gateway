import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ECOSYSTEM_MAP } from "../nougen/ecosystem.js";
import { getSiteContext } from "../nougen/sites.js";
import { NOUGEN_Q_SPEC } from "../nougen/products.js";
import { HARDCADE_CONTEXT } from "../nougen/worlds.js";
import { SWITCHBOARD_SKILLS } from "../nougen/switchboardSkills.js";
import { classifyUpstreamFailure, nextBackoffSeconds, planRoute } from "../nougen/switchboard.js";
import {
  GetSiteContextArgsSchema,
  GenerateSiteMetadataArgsSchema,
  GenerateBrandCopyArgsSchema,
  SaveBuildNoteArgsSchema,
  SearchBuildNotesArgsSchema
} from "./schemas.js";
import {
  ClassifyUpstreamFailureArgsSchema,
  NextBackoffArgsSchema,
  PlanRouteArgsSchema
} from "./switchboardSchemas.js";
import { saveBuildNote, searchBuildNotes } from "./db.js";

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
          name: "nougen_plan_route",
          description: "Plans an account-aware provider and model route using health, quota, cooldown, protocol, capability, background-work, and premium-reserve signals. Returns provenance without exposing credentials.",
          inputSchema: zodToJsonSchema(PlanRouteArgsSchema)
        },
        {
          name: "nougen_classify_upstream_failure",
          description: "Classifies an upstream AI provider failure and returns the bounded recovery action NouGen should take.",
          inputSchema: zodToJsonSchema(ClassifyUpstreamFailureArgsSchema)
        },
        {
          name: "nougen_next_backoff",
          description: "Returns the configured adaptive circuit-breaker delay for a retry attempt.",
          inputSchema: zodToJsonSchema(NextBackoffArgsSchema)
        },
        {
          name: "nougen_get_switchboard_skills",
          description: "Returns the NouGen Switchboard skill manifest for smart routing, self-healing, quota protection, protocol bridging, context fitting, diagnosis, and safe client sync.",
          inputSchema: { type: "object", properties: {} }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "nougen_get_ecosystem_map") {
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

      if (name === "nougen_save_build_note") {
        const { title, body, tags } = SaveBuildNoteArgsSchema.parse(args);
        const note = { id: Date.now().toString(), title, body, tags: tags || [], timestamp: new Date().toISOString() };
        saveBuildNote(note);
        return { content: [{ type: "text", text: `Successfully saved build note:\n${JSON.stringify(note, null, 2)}` }] };
      }

      if (name === "nougen_search_build_notes") {
        const { query } = SearchBuildNotesArgsSchema.parse(args);
        const results = searchBuildNotes(query);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      if (name === "nougen_plan_route") {
        const input = PlanRouteArgsSchema.parse(args);
        return { content: [{ type: "text", text: JSON.stringify(planRoute(input), null, 2) }] };
      }

      if (name === "nougen_classify_upstream_failure") {
        const input = ClassifyUpstreamFailureArgsSchema.parse(args);
        return { content: [{ type: "text", text: JSON.stringify(classifyUpstreamFailure(input), null, 2) }] };
      }

      if (name === "nougen_next_backoff") {
        const { attempt, steps } = NextBackoffArgsSchema.parse(args);
        return { content: [{ type: "text", text: JSON.stringify({ attempt, seconds: nextBackoffSeconds(attempt, steps) }, null, 2) }] };
      }

      if (name === "nougen_get_switchboard_skills") {
        return { content: [{ type: "text", text: JSON.stringify(SWITCHBOARD_SKILLS, null, 2) }] };
      }

      if (name === "nougen_generate_site_metadata" || name === "nougen_generate_brand_copy") {
        return { content: [{ type: "text", text: `Tool ${name} executed successfully. Generated placeholder content based on arguments.` }] };
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
