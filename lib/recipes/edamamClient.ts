import type { NormalizedRecipe, PlannerPreferences } from "@/lib/planner/types";
import { adaptEdamamRecipe } from "@/lib/recipes/recipeAdapter";

const BASE_URL = "https://api.edamam.com/api/recipes/v2";

type SearchOptions = {
  count: number;
  preferences?: PlannerPreferences;
};

const DESSERT_KEYWORDS = [
  "candy",
  "icing",
  "frosting",
  "oreo",
  "cookie",
  "cupcake",
  "brownie",
  "cake",
  "sprinkles",
  "caramel",
  "marshmallow",
  "dessert",
];

function buildDietParams(preferences: PlannerPreferences | undefined, params: URLSearchParams) {
  const diet = preferences?.diet?.toLowerCase();
  if (!diet) return;

  const supportedDiet = new Set([
    "balanced",
    "high-fiber",
    "high-protein",
    "low-carb",
    "low-fat",
    "low-sodium",
  ]);

  const supportedHealth = new Set([
    "vegan",
    "vegetarian",
    "gluten-free",
    "dairy-free",
    "egg-free",
    "peanut-free",
    "tree-nut-free",
    "soy-free",
    "fish-free",
    "shellfish-free",
  ]);

  if (supportedDiet.has(diet)) params.append("diet", diet);
  if (supportedHealth.has(diet)) params.append("health", diet);
}

function looksLikeDessert(recipe: NormalizedRecipe): boolean {
  const haystack = `${recipe.title} ${recipe.ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
  return DESSERT_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export async function fetchEdamamCandidates({
  count,
  preferences,
}: SearchOptions): Promise<NormalizedRecipe[]> {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    return [];
  }

  const params = new URLSearchParams({
    type: "public",
    app_id: appId,
    app_key: appKey,
    random: "true",
    q: preferences?.cuisine || "healthy meals",
  });

  buildDietParams(preferences, params);
  for (const keyword of DESSERT_KEYWORDS) {
    params.append("excluded", keyword);
  }

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    hits?: Array<{ recipe: unknown }>;
  };

  const recipes = (payload.hits ?? [])
    .map((hit) => hit.recipe)
    .slice(0, count)
    .map((recipe) => adaptEdamamRecipe(recipe as never))
    .filter((recipe) => recipe.calories > 0 && recipe.proteinG >= 0 && !looksLikeDessert(recipe));

  return recipes;
}
