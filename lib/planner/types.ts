export type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type PlannerPreferences = {
  diet?: string;
  cuisine?: string;
  excludeIngredients?: string[];
};

export type MealPlanRequest = {
  horizonDays: 1 | 7;
  mealsPerDay: number;
  targets: MacroTargets;
  preferences?: PlannerPreferences;
};

export type RecipeIngredient = {
  name: string;
  amount: number;
  unit?: string;
};

export type NormalizedRecipe = {
  id: string;
  source: "spoonacular" | "edamam" | "mock";
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
  servings: number;
  readyInMinutes?: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sugarG?: number;
  ingredients: RecipeIngredient[];
};

export type PlannedMeal = {
  dayIndex: number;
  mealIndex: number;
  recipe: NormalizedRecipe;
};

export type NutritionTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MacroDeviation = {
  caloriesPct: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};
