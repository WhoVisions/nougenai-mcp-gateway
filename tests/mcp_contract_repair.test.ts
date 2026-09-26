import { searchNouGenMessages } from "../src/nougen/nougenmsg.js";
import { performScopedRecall } from "../src/nougen/federation.js";

async function runTests() {
  console.log("▶ Running MCP Contract Repair Tests...");

  // Test 1: nougenmsg_search invocation and filtering
  const msgResult = searchNouGenMessages({ limit: 5 });
  if (typeof msgResult.total_scanned !== "number") {
    throw new Error("Expected total_scanned to be a number");
  }
  if (!Array.isArray(msgResult.messages)) {
    throw new Error("Expected messages to be an array");
  }
  console.log(`✔ Test 1 passed: nougenmsg_search returned ${msgResult.messages.length} messages (scanned ${msgResult.total_scanned} files).`);

  // Test 2: shards_recall with truthful scoped federation
  const recallResult = performScopedRecall("Scalpel First", 3);
  if (!recallResult.request_complete) {
    throw new Error("Expected request_complete to be true");
  }
  if (!Array.isArray(recallResult.responded_nodes) || recallResult.responded_nodes.length === 0) {
    throw new Error("Expected responded_nodes list in federation telemetry");
  }
  if (recallResult.deadline_exceeded === undefined) {
    throw new Error("Expected explicit deadline_exceeded flag");
  }
  console.log(`✔ Test 2 passed: shards_recall truthful federation contract validated (responded nodes: ${recallResult.responded_nodes.join(", ")}).`);

  console.log("🎉 All MCP Contract Repair tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
