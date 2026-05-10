import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { BRAND_MISSION } from "../nougen/ecosystem.js";
import { NOUGEN_Q_SPEC } from "../nougen/products.js";
import { HARDCADE_CONTEXT, VEILVERSE_CONTEXT } from "../nougen/worlds.js";
import { SITES } from "../nougen/sites.js";

export function registerResources(server: Server) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "nougen://brand/mission",
          name: "NouGen Brand Mission",
          mimeType: "application/json",
          description: "Core mission and positioning of NouGen AI"
        },
        {
          uri: "nougen://brand/ecosystem-map",
          name: "NouGen Ecosystem Map",
          mimeType: "application/json",
          description: "Overview of the WhoVisions/NouGen ecosystem"
        },
        {
          uri: "nougen://products/nougen-q",
          name: "NouGen Q Specification",
          mimeType: "application/json",
          description: "Technical and product spec for NouGen Q"
        },
        {
          uri: "nougen://worlds/hardcade",
          name: "Hardcade World Context",
          mimeType: "application/json",
          description: "Philosophical context for the Hardcade project"
        },
        {
          uri: "nougen://worlds/veilverse",
          name: "VeilVerse World Context",
          mimeType: "application/json",
          description: "Philosophical context for the VeilVerse project"
        },
        ...SITES.map(site => ({
          uri: `nougen://sites/${site.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${site.name} Site Context`,
          mimeType: "application/json",
          description: `Context for ${site.name}`
        }))
      ]
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    let content: any = null;

    if (uri === "nougen://brand/mission") content = BRAND_MISSION;
    else if (uri === "nougen://products/nougen-q") content = NOUGEN_Q_SPEC;
    else if (uri === "nougen://worlds/hardcade") content = HARDCADE_CONTEXT;
    else if (uri === "nougen://worlds/veilverse") content = VEILVERSE_CONTEXT;
    else {
      // Check for site context
      const siteMatch = uri.match(/^nougen:\/\/sites\/(.+)$/);
      if (siteMatch) {
        const siteSlug = siteMatch[1];
        content = SITES.find(s => s.name.toLowerCase().replace(/\s+/g, '-') === siteSlug);
      }
    }

    if (!content) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(content, null, 2)
      }]
    };
  });
}
