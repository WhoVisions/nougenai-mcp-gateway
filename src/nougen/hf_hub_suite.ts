/**
 * 📚 Hugging Face Hub & Ecosystem Universal Reference & Integration Suite
 * 
 * Comprehensive Architecture Spec & Runtime Client Helpers covering:
 * 1. huggingface.js Monorepo (@huggingface/inference, @huggingface/hub, @huggingface/gguf, @huggingface/jinja, @huggingface/agents)
 * 2. huggingface_hub Python SDK (HfApi, InferenceClient, AsyncInferenceClient, CommitOperations, Space Hardware)
 * 3. Hugging Face Hub Platform (Inference Endpoints, Spaces, Webhooks, Quotas, Model/Dataset Taxonomy)
 */

export interface HfRepoDescriptor {
  repoId: string;
  type: "model" | "dataset" | "space";
  private?: boolean;
  sdk?: "gradio" | "streamlit" | "docker" | "static";
}

export interface HfInferenceRequest {
  model: string;
  task: "text-generation" | "chat-completion" | "text-to-image" | "feature-extraction" | "automatic-speech-recognition";
  inputs: any;
  parameters?: Record<string, any>;
  provider?: "hf-inference" | "inference-endpoints" | "replicate" | "together" | "sambanova" | "fal-ai";
}

export interface HfSpaceHardwareConfig {
  spaceId: string;
  flavor: "cpu-basic" | "cpu-upgrade" | "t4-small" | "t4-medium" | "a10g-small" | "a10g-large" | "a100-large" | "h100";
  sleepTimeSeconds?: number;
}

export class HfEcosystemArchitect {
  /**
   * Generates Python snippet for atomic commit operation using huggingface_hub HfApi.
   */
  public static generatePythonCommitSnippet(repoId: string, operations: Array<{ path_in_repo: string; path_or_fileobj: string }>): string {
    return `from huggingface_hub import HfApi, CommitOperationAdd

api = HfApi()
operations = [
${operations.map(op => `    CommitOperationAdd(path_in_repo="${op.path_in_repo}", path_or_fileobj="${op.path_or_fileobj}")`).join(",\n")}
]

api.create_commit(
    repo_id="${repoId}",
    operations=operations,
    commit_message="feat: autonomous fleet asset upload via NouGen"
)`;
  }

  /**
   * Generates TypeScript snippet for streaming chat completion using @huggingface/inference.
   */
  public static generateJsStreamingChatSnippet(model: string, userPrompt: string): string {
    return `import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

for await (const chunk of hf.chatCompletionStream({
  model: "${model}",
  messages: [{ role: "user", content: "${userPrompt}" }],
  max_tokens: 512,
  temperature: 0.7,
})) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`;
  }

  /**
   * Generates Space Dockerfile blueprint with optimal caching and unprivileged user.
   */
  public static generateSpaceDockerfile(nodeVersion: string = "22", port: number = 7860): string {
    return `FROM node:${nodeVersion}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=${port}

# Create unprivileged user for Hugging Face Spaces security
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

COPY --chown=user:user package*.json ./
RUN npm ci --omit=dev

COPY --chown=user:user . .

EXPOSE ${port}
CMD ["npm", "start"]`;
  }
}
