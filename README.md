# NouGen MCP Gateway

The machine-readable context gateway for the NouGen AI ecosystem.

## Routes
- `GET /health`: Service health check
- `GET /docs`: Integration documentation
- `GET /mcp`: MCP SSE connection endpoint
- `POST /messages`: MCP message handler
- `GET /.well-known/nougen.json`: Public metadata

## Integration

### Antigravity Config
Add the following to your `mcpServers` configuration:

```json
{
  "mcpServers": {
    "nougen": {
      "transport": "http",
      "url": "https://mcp.nougenai.com/mcp"
    }
  }
}
```

## Available Resources
- `nougen://brand/mission`: Core mission and slogan
- `nougen://products/nougen-q`: NouGen Q product specification
- `nougen://worlds/hardcade`: Hardcade project context

## Available Tools
- `nougen_get_ecosystem_map`: Get the full WhoVisions/NouGen map
- `nougen_get_site_context`: Get context for a specific site (e.g. whovisions, aiwithdav3)
- `nougen_generate_site_metadata`: Generate SEO/Meta tags for ecosystem sites
- `nougen_generate_brand_copy`: Generate high-fidelity brand copy
- `nougen_get_nougen_q_spec`: Get the spec for NouGen Q
- `nougen_get_hardcade_context`: Get Hardcade context
- `nougen_save_build_note`: Save persistent build memory (SQLite/FTS5)
- `nougen_search_build_notes`: Search build memory via FTS5

## Available Prompts
- `deep_grip_project`: Convert project ideas into NouGen-native specs

## Roadmap
- [x] Implement bearer token authentication
- [x] Implement persistent SQLite/FTS5 memory layer
- [ ] Connect to Notion for real-time memory retrieval
- [ ] Add Wispr and local-file connectors
- [ ] Implement Bayesian reranker for semantic search
