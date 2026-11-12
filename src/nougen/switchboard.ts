export type ProviderHealth = "healthy" | "degraded" | "cooldown" | "offline";

export interface ProviderCandidate {
  id: string;
  provider: string;
  models: string[];
  quotaPercent: number;
  health?: ProviderHealth;
  cooldownUntil?: string;
  resetAt?: string;
  latencyMs?: number;
  priority?: number;
  premium?: boolean;
  capabilities?: string[];
  protocols?: string[];
}

export interface RoutePlanInput {
  requestedModel: string;
  providerCandidates: ProviderCandidate[];
  customMappings?: Record<string, string>;
  fallbackModels?: string[];
  protocol?: string;
  capability?: string;
  background?: boolean;
  reservePremiumBelow?: number;
  allowProtectedPremium?: boolean;
  now?: string;
}

export interface RouteSelection {
  candidateId: string;
  provider: string;
  model: string;
  score: number;
  quotaPercent: number;
  protectedPremium: boolean;
  reasons: string[];
}

function wildcardRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function resolveStaticModel(
  requestedModel: string,
  customMappings: Record<string, string> = {},
): { model: string; matchedRule?: string } {
  if (customMappings[requestedModel]) {
    return { model: customMappings[requestedModel], matchedRule: requestedModel };
  }

  const wildcardRules = Object.entries(customMappings)
    .filter(([rule]) => rule.includes("*"))
    .sort(([a], [b]) => b.replace(/\*/g, "").length - a.replace(/\*/g, "").length);

  for (const [rule, target] of wildcardRules) {
    if (wildcardRegex(rule).test(requestedModel)) {
      return { model: target, matchedRule: rule };
    }
  }

  return { model: requestedModel };
}

function parseTime(value: string | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function planRoute(input: RoutePlanInput) {
  const nowMs = parseTime(input.now) ?? Date.now();
  const reserveThreshold = input.reservePremiumBelow ?? 15;
  const staticResolution = resolveStaticModel(input.requestedModel, input.customMappings);
  const modelOrder = unique([staticResolution.model, ...(input.fallbackModels ?? [])]);

  const evaluated: RouteSelection[] = [];

  for (const candidate of input.providerCandidates) {
    const health = candidate.health ?? "healthy";
    if (health === "offline") continue;

    const cooldownMs = parseTime(candidate.cooldownUntil);
    if (health === "cooldown" && cooldownMs === null) continue;
    if (cooldownMs !== null && cooldownMs > nowMs) continue;

    if (input.protocol && candidate.protocols?.length && !candidate.protocols.includes(input.protocol)) continue;
    if (input.capability && candidate.capabilities?.length && !candidate.capabilities.includes(input.capability)) continue;

    const chosenModel = modelOrder.find((model) => candidate.models.includes(model));
    if (!chosenModel) continue;

    const protectedPremium = Boolean(
      candidate.premium &&
      candidate.quotaPercent <= reserveThreshold &&
      !input.allowProtectedPremium,
    );

    const reasons: string[] = [];
    let score = candidate.quotaPercent;

    if (chosenModel === staticResolution.model) {
      score += 40;
      reasons.push("requested_or_static_model_available");
    } else {
      reasons.push("compatible_model_fallback");
    }

    if (health === "healthy") {
      score += 20;
      reasons.push("healthy");
    } else if (health === "degraded") {
      score += 5;
      reasons.push("degraded_but_usable");
    }

    score += (candidate.priority ?? 0) * 10;
    score -= Math.max(0, candidate.latencyMs ?? 0) / 200;

    if (input.background && candidate.premium) {
      score -= 25;
      reasons.push("background_premium_conservation");
    }

    if (protectedPremium) {
      score -= 1000;
      reasons.push("premium_quota_protected");
    }

    evaluated.push({
      candidateId: candidate.id,
      provider: candidate.provider,
      model: chosenModel,
      score: Number(score.toFixed(3)),
      quotaPercent: candidate.quotaPercent,
      protectedPremium,
      reasons,
    });
  }

  const unprotected = evaluated.filter((candidate) => !candidate.protectedPremium);
  const pool = unprotected.length > 0 ? unprotected : evaluated;
  pool.sort((a, b) => b.score - a.score);

  const selected = pool[0] ?? null;

  return {
    requestedModel: input.requestedModel,
    staticallyResolvedModel: staticResolution.model,
    matchedMappingRule: staticResolution.matchedRule ?? null,
    selected,
    usedProtectedPremium: Boolean(selected?.protectedPremium),
    alternatives: pool.slice(1, 6),
    context: {
      protocol: input.protocol ?? null,
      capability: input.capability ?? null,
      background: Boolean(input.background),
      reservePremiumBelow: reserveThreshold,
    },
  };
}

export interface FailureInput {
  status?: number;
  message?: string;
  retryAfterSeconds?: number;
}

export function classifyUpstreamFailure(input: FailureInput) {
  const status = input.status;
  const message = (input.message ?? "").toLowerCase();
  const quotaSignal = /quota|rate.?limit|too many requests|resource exhausted/.test(message);

  if (status === 401) {
    return { class: "auth", action: "refresh_auth_then_rotate", retryable: true };
  }
  if (status === 403) {
    return { class: "forbidden", action: "disable_candidate_then_rotate", retryable: true };
  }
  if (status === 429 || quotaSignal) {
    return {
      class: "quota_or_rate_limit",
      action: "cooldown_then_rotate",
      retryable: true,
      retryAfterSeconds: input.retryAfterSeconds ?? null,
    };
  }
  if (status === 408 || status === 502 || status === 503 || status === 504) {
    return { class: "transient", action: "backoff_then_retry_or_rotate", retryable: true };
  }
  if (status !== undefined && status >= 500) {
    return { class: "upstream", action: "retry_then_rotate", retryable: true };
  }

  return { class: "terminal_or_unknown", action: "propagate_with_trace", retryable: false };
}

export function nextBackoffSeconds(attempt: number, steps: number[] = [15, 60, 300, 900]) {
  if (steps.length === 0) return 0;
  const index = Math.max(0, Math.min(attempt, steps.length - 1));
  return Math.max(0, steps[index]);
}
