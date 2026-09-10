export const SWITCHBOARD_SKILLS = {
  smart_route: {
    purpose: "Choose a provider, account lane, and compatible model while preserving the caller's requested capability and conserving scarce quota.",
    sequence: [
      "Hydrate provider health, model availability, quota, cooldown, and protocol capability.",
      "Resolve exact and wildcard model policy before account selection.",
      "Select an eligible provider candidate.",
      "After selection, use compatible fallback models only when the requested model is unavailable on that candidate.",
      "Emit route provenance so later retries know what changed."
    ],
    invariants: [
      "Preserve an exact requested model when the selected candidate can serve it.",
      "Do not spend protected premium quota for background work while a usable unprotected route exists.",
      "Never expose provider credentials in route output."
    ]
  },
  self_heal_request: {
    purpose: "Recover from provider failures without turning autonomous loops into retry storms.",
    sequence: [
      "Classify the upstream failure.",
      "Honor Retry After when supplied.",
      "Apply adaptive cooldown for quota or rate limits.",
      "Refresh or rotate on authentication failures.",
      "Retry transient upstream failures with bounded backoff, then rotate.",
      "Persist a trace of each retry and route mutation."
    ],
    invariants: [
      "Bound retries.",
      "Preserve idempotency for actions with side effects.",
      "Do not repeatedly hammer a candidate already in cooldown."
    ]
  },
  quota_guardian: {
    purpose: "Reserve scarce models and accounts for work that actually needs them.",
    sequence: [
      "Read current quota and reset time.",
      "Apply configured reserve thresholds by provider or model family.",
      "Prefer local, free, or lower cost lanes for background and maintenance work.",
      "Automatically restore protected routes after quota reset or health recovery."
    ],
    invariants: [
      "Quota protection changes routing, not credential visibility.",
      "Zero quota can lock a candidate until its known reset time.",
      "Foreground work may explicitly override protection when no equivalent route exists."
    ]
  },
  protocol_bridge: {
    purpose: "Normalize OpenAI, Anthropic, Gemini, and MCP request semantics at the gateway boundary.",
    sequence: [
      "Identify the incoming protocol.",
      "Normalize message roles, tool schemas, tool call identifiers, and streaming expectations.",
      "Route against canonical NouGen capability metadata.",
      "Map the response back to the caller's protocol without leaking provider specific internals."
    ],
    invariants: [
      "Preserve tool call identity across translation.",
      "Preserve streaming semantics when the target supports them.",
      "Use tool specific schema adapters only after generic normalization."
    ]
  },
  context_fit: {
    purpose: "Keep long autonomous sessions inside the selected model's actual context envelope.",
    sequence: [
      "Estimate the request context before dispatch.",
      "Compare it with the selected model's known context limit.",
      "Compress large tool results and repeated telemetry first.",
      "Condense older conversational context only when necessary.",
      "Escalate to a larger context route when compression would destroy required evidence."
    ],
    invariants: [
      "Do not silently discard canon locks, user constraints, or unresolved tool state.",
      "Prefer provenance preserving compression over blind truncation."
    ]
  },
  gateway_diagnose: {
    purpose: "Explain why a NouGen request routed, failed, retried, or consumed unexpected quota.",
    sequence: [
      "Read context state and multi vault health.",
      "Read route trace and candidate health.",
      "Join Tracker usage with provider quota and cooldown data.",
      "Check current Relay ownership before prescribing duplicate work.",
      "Return provenance marked findings and the smallest corrective action."
    ],
    invariants: [
      "A timed out vault is unknown, not empty.",
      "Never report full context when federation completeness is unproven."
    ]
  },
  client_sync: {
    purpose: "Point supported coding clients at the NouGen gateway safely and reproducibly.",
    sequence: [
      "Detect the client and current configuration.",
      "Generate a proposed gateway configuration.",
      "Show the diff and preserve a backup before mutation.",
      "Run a health probe and one minimal protocol test after sync."
    ],
    invariants: [
      "Never overwrite client configuration without a recoverable previous state.",
      "Never place raw upstream provider credentials in generated client configuration."
    ]
  }
} as const;
