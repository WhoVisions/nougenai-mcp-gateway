import "dotenv/config";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server.js";

const app = express();
// Respect the platform-injected PORT (Cloud Run, Heroku, etc.); fall back to 8787 for local dev.
const port = Number(process.env.PORT) || 8787;

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "nougenai-mcp-gateway",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

app.get("/docs", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>NouGen MCP Docs</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; }
          code { background: #1e293b; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
          pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>NouGen MCP Gateway</h1>
        <p>To connect to this server, use the following URL in your MCP client:</p>
        <pre>https://mcp.nougenai.com/mcp</pre>
        <h2>Antigravity Configuration</h2>
        <pre>
{
  "mcpServers": {
    "nougen": {
      "transport": "http",
      "url": "https://mcp.nougenai.com/mcp"
    }
  }
}
        </pre>
      </body>
    </html>
  `);
});

app.get("/.well-known/nougen.json", (req, res) => {
  res.json({
    name: "NouGen AI",
    description: "Machine-readable context gateway for the NouGen ecosystem",
    version: "1.0.0",
    capabilities: ["resources", "tools", "prompts"],
    links: {
      mcp: "https://mcp.nougenai.com/mcp",
      health: "https://mcp.nougenai.com/health",
      docs: "https://mcp.nougenai.com/docs"
    }
  });
});

const AUTH_TOKEN = process.env.NOUGEN_MCP_TOKEN;

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!AUTH_TOKEN) {
    // If no token configured, allow access but warn (or we could strictly deny)
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Unauthorized: Missing or invalid Bearer token");
    return;
  }
  
  const token = authHeader.split(" ")[1];
  if (token !== AUTH_TOKEN) {
    res.status(403).send("Forbidden: Invalid token");
    return;
  }
  
  next();
};

const transports = new Map<string, SSEServerTransport>();

// MCP SSE Endpoint
app.get("/mcp", authMiddleware, async (req, res) => {
  console.log("New MCP SSE connection attempt");
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  
  // Clean up on close
  res.on('close', () => {
    transports.delete(transport.sessionId);
  });
  
  await server.connect(transport);
});

// MCP Messages Endpoint
app.post("/messages", authMiddleware, async (req, res) => {

  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).send("Missing sessionId parameter");
    return;
  }
  
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(400).send("No active SSE connection for this session");
    return;
  }
  
  await transport.handlePostMessage(req, res);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`NouGen MCP Gateway listening at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`MCP Endpoint: http://localhost:${port}/mcp`);
});
