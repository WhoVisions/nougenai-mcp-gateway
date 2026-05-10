import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export function registerPrompts(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: "deep_grip_project",
          description: "Turn a project thread or idea into a deep NouGen spec.",
          arguments: [
            { name: "thread", description: "The project thread or raw idea text", required: true }
          ]
        },
        {
          name: "audit_site",
          description: "Audit a site against NouGen brand pillars.",
          arguments: [
            { name: "url", description: "The URL of the site to audit", required: true }
          ]
        },
        {
          name: "build_landing_page",
          description: "Generate a landing page spec.",
        },
        {
          name: "convert_thread_to_spec",
          description: "Convert a loose thread into a structured spec.",
        },
        {
          name: "generate_mcp_tool",
          description: "Scaffold a new MCP tool.",
        },
        {
          name: "generate_seo_metadata",
          description: "Generate SEO metadata.",
        },
        {
          name: "create_nougen_q_module",
          description: "Design a new module for NouGen Q.",
        },
        {
          name: "create_hardcade_essay_outline",
          description: "Outline an essay within the Hardcade framing.",
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "deep_grip_project") {
      const thread = args?.thread || "[No thread provided]";
      return {
        description: "Deep Grip Project Spec Generator",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze the following project thread and transform it into a NouGen-native specification. Focus on local-first architecture, semantic memory requirements, and the next useful move loop.\n\nThread:\n${thread}`
            }
          }
        ]
      };
    }
    
    // Fallback for other prompts
    return {
        description: `Prompt template for ${name}`,
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please help me with: ${name}. ${args ? `Arguments: ${JSON.stringify(args)}` : ''}`
                }
            }
        ]
    }

  });
}
