import { HfEcosystemArchitect } from "../src/nougen/hf_hub_suite.js";

async function runTests() {
  console.log("▶ Running Hugging Face Ecosystem Suite Tests...");

  // Test 1: Python commit snippet generation
  const pySnippet = HfEcosystemArchitect.generatePythonCommitSnippet("WhoVisions/test-repo", [
    { path_in_repo: "model.safetensors", path_or_fileobj: "./model.safetensors" }
  ]);
  if (!pySnippet.includes("CommitOperationAdd") || !pySnippet.includes("WhoVisions/test-repo")) {
    throw new Error("Failed to generate valid Python commit snippet");
  }
  console.log("✔ Test 1 passed: Python commit snippet generation.");

  // Test 2: JS streaming snippet generation
  const jsSnippet = HfEcosystemArchitect.generateJsStreamingChatSnippet("meta-llama/Llama-3.3-70B-Instruct", "Hello");
  if (!jsSnippet.includes("HfInference") || !jsSnippet.includes("chatCompletionStream")) {
    throw new Error("Failed to generate valid JS streaming snippet");
  }
  console.log("✔ Test 2 passed: JS streaming chat snippet generation.");

  // Test 3: Space Dockerfile generation
  const dockerfile = HfEcosystemArchitect.generateSpaceDockerfile("22", 7860);
  if (!dockerfile.includes("EXPOSE 7860") || !dockerfile.includes("useradd -m -u 1000 user")) {
    throw new Error("Failed to generate valid Space Dockerfile");
  }
  console.log("✔ Test 3 passed: Space Dockerfile generation with security compliance.");

  console.log("🎉 All Hugging Face Ecosystem Suite tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
