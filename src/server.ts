import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerResources } from "./mcp/resources.js";
import { registerTools } from "./mcp/tools.js";
import { registerPrompts } from "./mcp/prompts.js";

export const server = new Server(
  {
    name: "nougenai-mcp-gateway",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

registerResources(server);
registerTools(server);
registerPrompts(server);
