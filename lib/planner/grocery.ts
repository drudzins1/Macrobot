import type { PlannedMeal } from "@/lib/planner/types";

export type GroceryItem = {
  name: string;
  amount: number;
  unit?: string;
};

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .replace(
      /\b(chopped|diced|minced|sliced|fresh|large|small|medium|boneless|skinless|extra-virgin|ground)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ies$/, "y")
    .replace(/s$/, "");
}

function normalizeUnit(unit?: string): string {
  if (!unit) return "";
  const cleaned = unit.toLowerCase().trim();
  if (cleaned === "tablespoons") return "tbsp";
  if (cleaned === "teaspoons") return "tsp";
  if (cleaned === "grams") return "g";
  if (cleaned === "kilograms") return "kg";
  if (cleaned === "ounces") return "oz";
  if (cleaned === "pounds") return "lb";
  return cleaned;
}

function displayName(normalizedName: string): string {
  return normalizedName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildGroceryList(meals: PlannedMeal[]): GroceryItem[] {
  const totals = new Map<string, GroceryItem>();

  for (const meal of meals) {
    for (const ingredient of meal.recipe.ingredients) {
      const normalizedName = normalizeIngredientName(ingredient.name) || ingredient.name.toLowerCase();
      const normalizedUnit = normalizeUnit(ingredient.unit);
      const key = `${normalizedName}::${normalizedUnit}`;
      const existing = totals.get(key);
      if (!existing) {
        totals.set(key, {
          name: displayName(normalizedName),
          amount: ingredient.amount,
          unit: normalizedUnit || undefined,
        });
      } else {
        existing.amount += ingredient.amount;
      }
    }
  }

  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name));
}
