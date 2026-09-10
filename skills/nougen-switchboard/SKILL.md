# NouGen Switchboard

## Purpose

Turn provider choice, model choice, quota protection, retries, protocol translation, and client configuration into one repeatable NouGen control plane.

This skill is a clean room behavioral recursion inspired by account aware gateway patterns. Do not copy upstream source code or import its credential storage model.

## Mandatory preflight

1. Establish NouGen context state and gateway identity.
2. Hydrate only task relevant Shards and current Relay ownership.
3. Read provider health, supported models, quota remaining, reset time, cooldown state, protocol support, and recent Tracker pressure.
4. Treat unreachable vaults and providers as unknown or degraded, never empty or healthy by assumption.
5. Keep credentials inside Keymaker or the provider specific secret store. Skills consume opaque account or lane identifiers only.

## Mode: smart_route

Use `nougen_plan_route` before an execution lane is chosen.

Preserve the exact requested model when an eligible candidate can serve it. Apply configured exact or wildcard mappings before account selection. After selection, use compatible fallback models only when the resolved model is unavailable on that candidate.

For background work, prefer healthy local, free, or lower cost candidates while preserving capability. Protect premium candidates below the configured reserve threshold unless no equivalent route exists or the caller explicitly overrides protection.

Always retain route provenance: requested model, resolved model, mapping rule, selected provider lane, fallback reason, quota state, and context state.

## Mode: self_heal_request

Use `nougen_classify_upstream_failure` after an upstream failure.

For authentication failure, refresh authorization where supported, then rotate. For forbidden account state, disable that candidate for routing and rotate. For quota or rate limit, honor Retry After when available, enter cooldown, and rotate. For transient upstream failures, use `nougen_next_backoff` with bounded attempts, then rotate.

Do not retry side effecting actions unless idempotency is proven. Never let autonomous loops hammer a candidate already in cooldown.

## Mode: quota_guardian

Join provider quota data with NouGen Tracker pressure. Protection is a routing decision, never a reason to expose or copy credentials.

A candidate at zero known quota may remain locked until its known reset time. A protected premium route can be used for foreground work only when an explicit override exists or no capability equivalent candidate remains. Restore the route automatically after reset or health recovery.

## Mode: protocol_bridge

Normalize caller protocol semantics at the gateway boundary for OpenAI compatible, Anthropic compatible, Gemini native, and MCP traffic.

Preserve message role order, tool call identity, streaming behavior, stop reasons, and structured tool results. Apply generic schema normalization first, then tool specific adapters. Provider specific internals should not leak back to clients unless needed for diagnosis.

## Mode: context_fit

Estimate context before dispatch. Compare the estimate with the selected model's real context envelope. Compress repeated telemetry and oversized tool results before condensing conversation history. Preserve canon locks, user constraints, unresolved actions, provenance markers, and current tool state.

If compression would destroy required evidence, route to a larger context candidate instead.

## Mode: gateway_diagnose

Correlate context state, multi vault health, route provenance, provider health, quota and cooldown, Tracker usage, and current Relay claims.

A timed out vault is unknown, not empty. Never report full context when federation completeness is unproven. Prefer the smallest corrective action that restores truthful routing.

## Mode: client_sync

Generate configuration for supported clients so they use the NouGen gateway rather than embedding upstream credentials directly. Inspect current configuration, produce a diff, preserve a recoverable backup, apply only the intended fields, then run a minimal health and protocol probe.

## Acceptance rules

1. No tool returns raw provider secrets.
2. Exact requested models survive when available.
3. Wildcard mappings prefer the most specific matching rule.
4. Protected premium quota is avoided when an equivalent unprotected route exists.
5. 401, 403, 429, timeout, and upstream 5xx paths produce bounded deterministic recovery actions.
6. Cooldown candidates are not selected before their cooldown expires.
7. Route output carries enough provenance to explain every rewrite or rotation.
8. Degraded NouGen context is visible and never represented as full context.
