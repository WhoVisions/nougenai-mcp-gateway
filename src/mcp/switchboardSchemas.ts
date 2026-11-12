import { z } from "zod";

export const ProviderCandidateSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  models: z.array(z.string()).min(1),
  quotaPercent: z.number().min(0).max(100),
  health: z.enum(["healthy", "degraded", "cooldown", "offline"]).default("healthy"),
  cooldownUntil: z.string().optional(),
  resetAt: z.string().optional(),
  latencyMs: z.number().min(0).optional(),
  priority: z.number().optional(),
  premium: z.boolean().default(false),
  capabilities: z.array(z.string()).default([]),
  protocols: z.array(z.string()).default([]),
});

export const PlanRouteArgsSchema = z.object({
  requestedModel: z.string().min(1),
  providerCandidates: z.array(ProviderCandidateSchema).min(1),
  customMappings: z.record(z.string()).default({}),
  fallbackModels: z.array(z.string()).default([]),
  protocol: z.string().optional(),
  capability: z.string().optional(),
  background: z.boolean().default(false),
  reservePremiumBelow: z.number().min(0).max(100).default(15),
  allowProtectedPremium: z.boolean().default(false),
  now: z.string().optional(),
});

export const ClassifyUpstreamFailureArgsSchema = z.object({
  status: z.number().int().min(100).max(599).optional(),
  message: z.string().optional(),
  retryAfterSeconds: z.number().min(0).optional(),
});

export const NextBackoffArgsSchema = z.object({
  attempt: z.number().int().min(0),
  steps: z.array(z.number().min(0)).min(1).default([15, 60, 300, 900]),
});
