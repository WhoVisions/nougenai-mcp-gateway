import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const TOKEN = "nougen_dev_token_123";
const BASE_URL = "http://localhost:8787/mcp";

async function runTest() {
  console.log("🚀 Starting NouGen Memory Smoke Test (SDK Mode)...");

  const transport = new SSEClientTransport(new URL(BASE_URL), {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${TOKEN}`
      }
    }
  });

  const client = new Client(
    { name: "smoke-test", version: "1.0.0" },
    { capabilities: {} }
  );

  console.log("📡 Connecting to server...");
  await client.connect(transport);
  console.log("✅ Handshake successful.");

  // 1. List Tools
  console.log("🔍 Listing Tools...");
  const tools = await client.listTools();
  console.log("🛠️ Tools Found:", tools.tools.map(t => t.name).join(", "));

  // 2. Save a Build Note
  const noteTitle = `Smoke Test ${Date.now()}`;
  console.log(`📝 Saving Build Note: "${noteTitle}"...`);
  const saveRes = await client.callTool({
    name: "nougen_save_build_note",
    arguments: {
      title: noteTitle,
      body: "This is a test note from the SDK smoke-memory script. Verified lexical recall loop via SSE.",
      tags: ["test", "smoke"]
    }
  });
  console.log("✅ Save Result:", JSON.stringify(saveRes, null, 2));

  // 3. Search for the Note
  console.log("🔎 Searching for Note...");
  const searchRes = await client.callTool({
    name: "nougen_search_build_notes",
    arguments: {
      query: "lexical recall loop"
    }
  });

  const contentText = searchRes.content[0].text;
  const found = contentText.includes(noteTitle);
  
  if (found) {
    console.log(`🏆 SMOKE TEST PASSED: Memory loop closed for "${noteTitle}".`);
  } else {
    console.error("❌ SMOKE TEST FAILED: Note not found in search results.");
    console.error("Search result was:", contentText);
    process.exit(1);
  }

  await transport.close();
  process.exit(0);
}

runTest().catch(err => {
  console.error("💥 Test Errored:", err);
  process.exit(1);
});
