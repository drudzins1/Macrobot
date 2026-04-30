import { mealScore, computeTotals, computeDeviation } from "@/lib/planner/scoring";
import type {
  MacroTargets,
  MealPlanRequest,
  NormalizedRecipe,
  PlannedMeal,
} from "@/lib/planner/types";

type PlanOutput = {
  meals: PlannedMeal[];
  totals: ReturnType<typeof computeTotals>;
  deviation: ReturnType<typeof computeDeviation>;
};

const MIN_PROTEIN_PER_MEAL_G = 18;
const MAX_SUGAR_PER_MEAL_G = 20;

function perMealTarget(targets: MacroTargets, mealsPerDay: number): MacroTargets {
  return {
    calories: targets.calories / mealsPerDay,
    proteinG: targets.proteinG / mealsPerDay,
    carbsG: targets.carbsG / mealsPerDay,
    fatG: targets.fatG / mealsPerDay,
  };
}

function chooseRecipe(
  candidates: NormalizedRecipe[],
  target: MacroTargets,
  weekRecipeCounts: Map<string, number>,
  dayRecipeIds: Set<string>,
  dayIngredientUse: Map<string, number>,
  weekIngredientUse: Map<string, number>,
): NormalizedRecipe {
  const proteinFloor = Math.max(MIN_PROTEIN_PER_MEAL_G, target.proteinG * 0.65);
  const qualityPool = candidates.filter((recipe) => {
    const sugarOk = recipe.sugarG === undefined || recipe.sugarG <= MAX_SUGAR_PER_MEAL_G;
    return recipe.proteinG >= proteinFloor && sugarOk;
  });
  const basePool = qualityPool.length > 0 ? qualityPool : candidates;
  const strictDailyPool = basePool.filter((recipe) => !dayRecipeIds.has(recipe.id));
  const pool = strictDailyPool.length > 0 ? strictDailyPool : basePool;

  const scoreIngredientPenalty = (recipe: NormalizedRecipe): number => {
    const ingredientNames = recipe.ingredients.map((i) => i.name.toLowerCase());
    let penalty = 0;
    for (const name of ingredientNames) {
      penalty += (dayIngredientUse.get(name) ?? 0) * 5;
      penalty += (weekIngredientUse.get(name) ?? 0) * 1.5;
    }
    return penalty;
  };

  const ranked = pool
    .map((recipe) => {
      const baseScore = mealScore(recipe, target);
      const repeatCount = weekRecipeCounts.get(recipe.id) ?? 0;
      const repeatPenalty = repeatCount * 25;
      const ingredientPenalty = scoreIngredientPenalty(recipe);
      return { recipe, score: baseScore + repeatPenalty + ingredientPenalty };
    })
    .sort((a, b) => a.score - b.score);

  return ranked[0]?.recipe ?? pool[0];
}

export function buildMealPlan(request: MealPlanRequest, candidates: NormalizedRecipe[]): PlanOutput {
  const target = perMealTarget(request.targets, request.mealsPerDay);
  const meals: PlannedMeal[] = [];
  const weekRecipeCounts = new Map<string, number>();
  const weekIngredientUse = new Map<string, number>();

  for (let day = 0; day < request.horizonDays; day += 1) {
    const dayRecipeIds = new Set<string>();
    const dayIngredientUse = new Map<string, number>();

    for (let mealIndex = 0; mealIndex < request.mealsPerDay; mealIndex += 1) {
      const picked = chooseRecipe(
        candidates,
        target,
        weekRecipeCounts,
        dayRecipeIds,
        dayIngredientUse,
        weekIngredientUse,
      );
      meals.push({ dayIndex: day, mealIndex, recipe: picked });
      dayRecipeIds.add(picked.id);
      weekRecipeCounts.set(picked.id, (weekRecipeCounts.get(picked.id) ?? 0) + 1);
      for (const ingredient of picked.ingredients) {
        const name = ingredient.name.toLowerCase();
        dayIngredientUse.set(name, (dayIngredientUse.get(name) ?? 0) + 1);
        weekIngredientUse.set(name, (weekIngredientUse.get(name) ?? 0) + 1);
      }
    }
  }

  const totals = computeTotals(meals);
  const expectedTotals = {
    calories: request.targets.calories * request.horizonDays,
    proteinG: request.targets.proteinG * request.horizonDays,
    carbsG: request.targets.carbsG * request.horizonDays,
    fatG: request.targets.fatG * request.horizonDays,
  };

  return {
    meals,
    totals,
    deviation: computeDeviation(totals, expectedTotals),
  };
}
