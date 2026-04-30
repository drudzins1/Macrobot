import { adaptSpoonacularRecipe } from "@/lib/recipes/recipeAdapter";
import type { NormalizedRecipe, PlannerPreferences } from "@/lib/planner/types";

const BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";
const EXCLUDED_KEYWORDS = [
  "oreo",
  "truffle",
  "icing",
  "frosting",
  "candy",
  "cookie",
  "cupcake",
  "brownie",
  "cake",
  "dessert",
  "marshmallow",
];

type SearchOptions = {
  count: number;
  preferences?: PlannerPreferences;
};

function looksLikeDessert(recipe: NormalizedRecipe): boolean {
  const haystack = `${recipe.title} ${recipe.ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
  return EXCLUDED_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export async function fetchRecipeCandidates({
  count,
  preferences,
}: SearchOptions): Promise<NormalizedRecipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    apiKey,
    number: String(count),
    addRecipeNutrition: "true",
    fillIngredients: "true",
    instructionsRequired: "true",
    query: "healthy meals",
    sort: "popularity",
    sortDirection: "desc",
    minProtein: "10",
    maxSugar: "20",
  });

  if (preferences?.diet) params.set("diet", preferences.diet);
  if (preferences?.cuisine) params.set("cuisine", preferences.cuisine);
  const excludes = [
    ...(preferences?.excludeIngredients ?? []),
    ...EXCLUDED_KEYWORDS,
  ];
  params.set("excludeIngredients", excludes.join(","));

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { results?: unknown[] };
  const results = payload.results ?? [];

  if (!results.length) {
    return [];
  }

  return results
    .map((recipe) => adaptSpoonacularRecipe(recipe as never))
    .filter((recipe) => recipe.calories > 0 && recipe.proteinG >= 10 && !looksLikeDessert(recipe));
}
