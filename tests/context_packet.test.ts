import { resolveContextPacket } from "../src/nougen/context_packet.js";
import { saveBuildNote } from "../src/mcp/db.js";

async function runTests() {
  console.log("▶ Running NouGen Context Mode Tests...");

  // Seed sample note
  saveBuildNote({
    id: "test-note-1",
    title: "Scalpel First Retrieval Doctrine",
    body: "Start with smallest operation capable of answering. Progressive expansion only on evidence.",
    tags: ["retrieval", "context", "scalpel"],
    canon_link: "AI Experiments",
    agent_origin: "Blade",
    timestamp: new Date().toISOString()
  });

  // Test 1: Exact match query
  const packet1 = await resolveContextPacket("Scalpel First", { max_results: 3 });
  if (packet1.retrieval_count < 1) {
    throw new Error(`Expected at least 1 hit for 'Scalpel First', got ${packet1.retrieval_count}`);
  }
  if (!packet1.provenance || packet1.provenance.length === 0) {
    throw new Error("Expected provenance tuples in context packet");
  }
  if (!packet1.coverage_sufficient) {
    throw new Error("Expected coverage_sufficient to be true for exact hit");
  }
  console.log("✔ Test 1 passed: Exact match retrieval with provenance tuples.");

  // Test 2: Empty query edge case
  const packet2 = await resolveContextPacket("");
  if (packet2.coverage_sufficient || packet2.retrieval_count !== 0) {
    throw new Error("Empty query should return 0 items and coverage_sufficient=false");
  }
  console.log("✔ Test 2 passed: Empty query edge case handled.");

  // Test 3: Bounded budget
  const packet3 = await resolveContextPacket("retrieval doctrine", { max_results: 1, deadline_ms: 1000 });
  if (packet3.items.length > 1) {
    throw new Error(`Expected max 1 item due to budget, got ${packet3.items.length}`);
  }
  console.log("✔ Test 3 passed: Bounded budget constraints enforced.");

  console.log("🎉 All NouGen Context Mode tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
