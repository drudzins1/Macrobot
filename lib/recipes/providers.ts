import type { NormalizedRecipe, PlannerPreferences } from "@/lib/planner/types";
import { fetchRecipeCandidates as fetchSpoonacularCandidates } from "@/lib/recipes/spoonacularClient";
import { fetchEdamamCandidates } from "@/lib/recipes/edamamClient";
import { mockRecipes } from "@/lib/recipes/mockRecipes";

type SearchOptions = {
  count: number;
  preferences?: PlannerPreferences;
};

type ProviderName = "spoonacular" | "edamam";
type ProviderStatus = "enabled" | "missing_credentials" | "ok" | "error";

export type ProviderTelemetry = {
  provider: ProviderName | "fallback";
  status: ProviderStatus;
  fetched: number;
  message?: string;
};

export type ProviderFetchResult = {
  recipes: NormalizedRecipe[];
  telemetry: ProviderTelemetry[];
  usedFallback: boolean;
};

const DEFAULT_PROVIDER_ORDER: ProviderName[] = ["spoonacular"];

function providerOrder(): ProviderName[] {
  const raw = process.env.RECIPE_PROVIDER_PRIORITY;
  if (!raw) return DEFAULT_PROVIDER_ORDER;

  const parsed = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is ProviderName => item === "spoonacular");

  return parsed.length ? parsed : DEFAULT_PROVIDER_ORDER;
}

function dedupe(recipes: NormalizedRecipe[]): NormalizedRecipe[] {
  const seen = new Set<string>();
  const unique: NormalizedRecipe[] = [];

  for (const recipe of recipes) {
    const key = `${recipe.title.toLowerCase()}::${Math.round(recipe.calories)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(recipe);
  }
  return unique;
}

export async function fetchFromConfiguredProviders({
  count,
  preferences,
}: SearchOptions): Promise<ProviderFetchResult> {
  const order = providerOrder();
  const all: NormalizedRecipe[] = [];
  const telemetry: ProviderTelemetry[] = [];

  for (const provider of order) {
    try {
      if (provider === "spoonacular") {
        if (!process.env.SPOONACULAR_API_KEY) {
          telemetry.push({
            provider,
            status: "missing_credentials",
            fetched: 0,
            message: "SPOONACULAR_API_KEY not set",
          });
          continue;
        }
        const candidates = await fetchSpoonacularCandidates({ count, preferences });
        const filtered = candidates.filter((r) => r.source !== "mock");
        all.push(...filtered);
        telemetry.push({ provider, status: "ok", fetched: filtered.length });
      }

      if (provider === "edamam") {
        if (!process.env.EDAMAM_APP_ID || !process.env.EDAMAM_APP_KEY) {
          telemetry.push({
            provider,
            status: "missing_credentials",
            fetched: 0,
            message: "EDAMAM_APP_ID/EDAMAM_APP_KEY not set",
          });
          continue;
        }
        const candidates = await fetchEdamamCandidates({ count, preferences });
        all.push(...candidates);
        telemetry.push({ provider, status: "ok", fetched: candidates.length });
      }
    } catch (error) {
      telemetry.push({
        provider,
        status: "error",
        fetched: 0,
        message: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  }

  const unique = dedupe(all);
  if (unique.length > 0) {
    return {
      recipes: unique.slice(0, count),
      telemetry,
      usedFallback: false,
    };
  }

  return {
    recipes: mockRecipes,
    telemetry: [
      ...telemetry,
      { provider: "fallback", status: "ok", fetched: mockRecipes.length, message: "Using local fallback recipe set" },
    ],
    usedFallback: true,
  };
}
