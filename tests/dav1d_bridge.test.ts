import { executeDav1dCommand } from "../src/nougen/dav1d_bridge.js";

async function runTests() {
  console.log("▶ Running Dav1d AGY Bridge Tests...");

  // Test 1: Subcommand preservation in requested_argv
  const receipt1 = executeDav1dCommand({
    binary: "node",
    subcommand: "-e",
    args: ['console.log("DAV1D_HIERARCHICAL_OK")']
  });

  if (!receipt1.argv_match) {
    throw new Error("Expected argv_match to be true");
  }
  if (!receipt1.stdout.includes("DAV1D_HIERARCHICAL_OK")) {
    throw new Error(`Expected execution stdout to contain DAV1D_HIERARCHICAL_OK, got: ${receipt1.stdout}`);
  }
  if (receipt1.executed_argv[1] !== "-e") {
    throw new Error(`Subcommand was not preserved in position 1: ${JSON.stringify(receipt1.executed_argv)}`);
  }
  console.log("✔ Test 1 passed: Subcommand and args strictly preserved.");

  // Test 2: Receipt verification fields
  if (!receipt1.request_id || !receipt1.engine || !receipt1.binary_version || !receipt1.timestamp) {
    throw new Error("Missing mandatory telemetry fields in Dav1dExecReceipt");
  }
  console.log("✔ Test 2 passed: Mandatory receipt schema fields present.");

  // Test 3: Exit code accuracy
  const receipt2 = executeDav1dCommand({
    binary: "node",
    args: ['-e', 'process.exit(42)']
  });
  if (receipt2.exit_code !== 42) {
    throw new Error(`Expected exit code 42, got ${receipt2.exit_code}`);
  }
  console.log("✔ Test 3 passed: Accurate exit code propagation.");

  console.log("🎉 All Dav1d AGY Bridge tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
