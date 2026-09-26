import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server.js";

import { BRAND_MISSION, BRAND_PILLARS } from "./nougen/ecosystem.js";
import fs from "node:fs";
import path from "node:path";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787;

// --- Security Middleware (DoS & Header Protection) ---
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false, // Disabling CSP strictly to allow our inline HTML/CSS dashboard
}));

// Global Rate Limiter: Max 100 requests per 10 minutes per IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 10 minutes."
});
app.use(limiter);
// -----------------------------------------------------


app.get("/", (req, res) => {
  let smiStatus = "Awaiting synchronization...";
  try {
    const transcriptDir = process.env.NOUGEN_TRANSCRIPTS_DIR || "c:/Users/super/Watchtower/nougenai-next/.nougen/transcripts";
    if (fs.existsSync(transcriptDir)) {
      const files = fs.readdirSync(transcriptDir).filter(f => f.endsWith('.txt')).sort();
      if (files.length > 0) {
        smiStatus = fs.readFileSync(path.join(transcriptDir, files[files.length - 1]), "utf-8");
      }
    }
  } catch (e) {
    // Fallback if transcripts are unavailable
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NouGen MCP Gateway | Axial State</title>
      <style>
        :root {
          --bg: #000000;
          --glass: rgba(255, 255, 255, 0.03);
          --border: rgba(255, 255, 255, 0.08);
          --accent: #22d3ee;
          --emerald: #10b981;
          --text: #f8fafc;
          --text-dim: #94a3b8;
        }
        body { 
          margin: 0; 
          font-family: 'Inter', -apple-system, sans-serif; 
          background: var(--bg); 
          color: var(--text); 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh;
          overflow: hidden;
        }
        .dashboard {
          width: 100%;
          max-width: 800px;
          padding: 2rem;
          background: var(--glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
        }
        .brand h1 { margin: 0; font-size: 1.5rem; letter-spacing: -0.025em; font-weight: 800; }
        .brand p { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
        .status-badge {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--emerald);
          padding: 0.4rem 0.8rem;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .status-pulse { width: 6px; height: 6px; background: var(--emerald); border-radius: 50%; box-shadow: 0 0 10px var(--emerald); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        
        .section-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-dim); margin-bottom: 1rem; }
        
        .grid-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-bottom: 2rem; }
        
        .smi-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1.5rem;
          height: 200px;
          overflow-y: auto;
        }
        .smi-text { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.8rem; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; margin: 0; }
        
        .hardening-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .hardening-item { display: flex; justify-content: space-between; align-items: center; }
        .hardening-item .label { font-size: 0.75rem; color: var(--text-dim); }
        .hardening-item .value { font-size: 0.7rem; font-weight: 700; font-family: monospace; }
        .status-ok { color: var(--emerald); }

        .pillars-grid {

          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }
        .pillar-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          padding: 1rem;
          border-radius: 0.75rem;
          text-align: center;
        }
        .pillar-card span { display: block; font-size: 0.75rem; font-weight: 600; }

        footer {
          margin-top: 3rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: var(--text-dim);
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="dashboard">
        <header>
          <div class="brand">
            <h1>${BRAND_MISSION.name}</h1>
            <p>MCP Gateway Gateway</p>
          </div>
          <div class="status-badge">
            <div class="status-pulse"></div>
            Axial Reconstitution Active
          </div>
        </header>

        <div class="grid-2">
          <div>
            <div class="section-title">Current Strategic Memory Index (SMI)</div>
            <div class="smi-container">
              <pre class="smi-text">${smiStatus || "No telemetry found."}</pre>
            </div>
          </div>
          
          <div>
            <div class="section-title">Gateway Hardening Layer</div>
            <div class="hardening-container">
              <div class="hardening-item">
                <span class="label">Forensic Defense</span>
                <span class="value status-ok">ACTIVE</span>
              </div>
              <div class="hardening-item">
                <span class="label">Scribe Protocol</span>
                <span class="value status-ok">ENFORCED</span>
              </div>
              <div class="hardening-item">
                <span class="label">Museum Glass</span>
                <span class="value status-ok">READ-ONLY EXTERNAL</span>
              </div>
              <div class="hardening-item">
                <span class="label">Memory Version</span>
                <span class="value">v2.0-FTS5</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-title">Grounded Brand Pillars</div>

        <div class="pillars-grid">
          ${BRAND_PILLARS.map(p => `
            <div class="pillar-card">
              <span>${p}</span>
            </div>
          `).join('')}
        </div>

        <footer>
          <div>v1.0.0-hardened</div>
          <div>${new Date().toISOString()}</div>
          <div>PORT: 8787</div>
        </footer>
      </div>
    </body>
    </html>
  `);
});

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

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authToken = process.env.NOUGEN_MCP_TOKEN;
  if (!authToken) {
    console.error("[SECURITY] MCP Gateway token is not configured in the environment. Blocking all incoming requests.");
    res.status(500).send("Internal Server Error: Security token missing.");
    return;
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Unauthorized: Missing or invalid Bearer token");
    return;
  }
  
  const token = authHeader.split(" ")[1];
  if (token !== authToken) {
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

export { app, server, transports };

export function startServer(listenPort: number = port) {
  return app.listen(listenPort, "0.0.0.0", () => {
    console.log(`NouGen MCP Gateway listening at http://localhost:${listenPort}`);
    console.log(`Health check: http://localhost:${listenPort}/health`);
    console.log(`MCP Endpoint: http://localhost:${listenPort}/mcp`);
  });
}

// Auto-start if run directly as script
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith("src/index.ts") || 
  process.argv[1].endsWith("src\\index.ts") || 
  process.argv[1].endsWith("dist/index.js") || 
  process.argv[1].endsWith("dist\\index.js")
);

if (isDirectRun && process.env.NODE_ENV !== "test") {
  startServer();
}

