import type { NormalizedRecipe, RecipeIngredient } from "@/lib/planner/types";

type SpoonacularIngredient = {
  name: string;
  amount: number;
  unit: string;
};

type SpoonacularNutrient = {
  name: string;
  amount: number;
  unit: string;
};

type SpoonacularRecipe = {
  id: number;
  title: string;
  image?: string;
  spoonacularSourceUrl?: string;
  sourceUrl?: string;
  servings?: number;
  readyInMinutes?: number;
  extendedIngredients?: SpoonacularIngredient[];
  nutrition?: {
    nutrients?: SpoonacularNutrient[];
  };
};

type EdamamRecipe = {
  uri: string;
  label: string;
  image?: string;
  url?: string;
  yield?: number;
  totalTime?: number;
  calories?: number;
  ingredientLines?: string[];
  ingredients?: Array<{
    food?: string;
    text?: string;
    quantity?: number;
    measure?: string;
  }>;
  totalNutrients?: {
    PROCNT?: { quantity?: number };
    CHOCDF?: { quantity?: number };
    FAT?: { quantity?: number };
    SUGAR?: { quantity?: number };
  };
};

function nutrientAmount(
  nutrients: SpoonacularNutrient[] | undefined,
  name: string,
): number {
  const nutrient = nutrients?.find((n) => n.name.toLowerCase() === name.toLowerCase());
  return nutrient?.amount ?? 0;
}

function mapIngredients(items: SpoonacularIngredient[] | undefined): RecipeIngredient[] {
  if (!items?.length) {
    return [];
  }

  return items.map((item) => ({
    name: item.name,
    amount: item.amount ?? 0,
    unit: item.unit || undefined,
  }));
}

export function adaptSpoonacularRecipe(recipe: SpoonacularRecipe): NormalizedRecipe {
  const nutrients = recipe.nutrition?.nutrients;

  return {
    id: String(recipe.id),
    source: "spoonacular",
    title: recipe.title,
    imageUrl: recipe.image,
    sourceUrl: recipe.spoonacularSourceUrl ?? recipe.sourceUrl,
    servings: recipe.servings ?? 1,
    readyInMinutes: recipe.readyInMinutes,
    calories: nutrientAmount(nutrients, "Calories"),
    proteinG: nutrientAmount(nutrients, "Protein"),
    carbsG: nutrientAmount(nutrients, "Carbohydrates"),
    fatG: nutrientAmount(nutrients, "Fat"),
    sugarG: nutrientAmount(nutrients, "Sugar"),
    ingredients: mapIngredients(recipe.extendedIngredients),
  };
}

export function adaptEdamamRecipe(recipe: EdamamRecipe): NormalizedRecipe {
  const servings = recipe.yield && recipe.yield > 0 ? recipe.yield : 1;
  const caloriesTotal = recipe.calories ?? 0;
  const ingredientItems =
    recipe.ingredients?.map((ingredient) => ({
      name: ingredient.food || ingredient.text || "Unknown ingredient",
      amount: (ingredient.quantity ?? 1) / servings,
      unit: ingredient.measure || undefined,
    })) ??
    (recipe.ingredientLines ?? []).map((line) => ({
      name: line,
      amount: 1 / servings,
      unit: undefined,
    }));

  return {
    id: recipe.uri,
    source: "edamam",
    title: recipe.label,
    imageUrl: recipe.image,
    sourceUrl: recipe.url,
    servings,
    readyInMinutes: recipe.totalTime,
    calories: caloriesTotal / servings,
    proteinG: (recipe.totalNutrients?.PROCNT?.quantity ?? 0) / servings,
    carbsG: (recipe.totalNutrients?.CHOCDF?.quantity ?? 0) / servings,
    fatG: (recipe.totalNutrients?.FAT?.quantity ?? 0) / servings,
    sugarG: (recipe.totalNutrients?.SUGAR?.quantity ?? 0) / servings,
    ingredients: ingredientItems,
  };
}
