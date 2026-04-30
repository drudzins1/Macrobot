import type {
  MacroDeviation,
  MacroTargets,
  NormalizedRecipe,
  NutritionTotals,
  PlannedMeal,
} from "@/lib/planner/types";

function safePctError(actual: number, target: number): number {
  if (target <= 0) return 0;
  return (Math.abs(actual - target) / target) * 100;
}

export function mealScore(recipe: NormalizedRecipe, perMealTarget: MacroTargets): number {
  const caloriesError = safePctError(recipe.calories, perMealTarget.calories);
  const proteinError = safePctError(recipe.proteinG, perMealTarget.proteinG);
  const carbsError = safePctError(recipe.carbsG, perMealTarget.carbsG);
  const fatError = safePctError(recipe.fatG, perMealTarget.fatG);

  return caloriesError * 0.35 + proteinError * 0.3 + carbsError * 0.2 + fatError * 0.15;
}

export function computeTotals(meals: PlannedMeal[]): NutritionTotals {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.recipe.calories,
      proteinG: totals.proteinG + meal.recipe.proteinG,
      carbsG: totals.carbsG + meal.recipe.carbsG,
      fatG: totals.fatG + meal.recipe.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function computeDeviation(totals: NutritionTotals, targets: MacroTargets): MacroDeviation {
  return {
    caloriesPct: safePctError(totals.calories, targets.calories),
    proteinPct: safePctError(totals.proteinG, targets.proteinG),
    carbsPct: safePctError(totals.carbsG, targets.carbsG),
    fatPct: safePctError(totals.fatG, targets.fatG),
  };
}
