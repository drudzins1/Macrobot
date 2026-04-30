import type { NormalizedRecipe } from "@/lib/planner/types";

export const mockRecipes: NormalizedRecipe[] = [
  {
    id: "mock-1",
    source: "mock",
    title: "Greek Yogurt Berry Bowl",
    servings: 1,
    calories: 410,
    proteinG: 32,
    carbsG: 44,
    fatG: 12,
    ingredients: [
      { name: "Greek yogurt", amount: 250, unit: "g" },
      { name: "Blueberries", amount: 100, unit: "g" },
      { name: "Granola", amount: 40, unit: "g" },
    ],
  },
  {
    id: "mock-2",
    source: "mock",
    title: "Chicken Rice Power Bowl",
    servings: 1,
    calories: 640,
    proteinG: 48,
    carbsG: 58,
    fatG: 21,
    ingredients: [
      { name: "Chicken breast", amount: 180, unit: "g" },
      { name: "Cooked rice", amount: 220, unit: "g" },
      { name: "Broccoli", amount: 120, unit: "g" },
    ],
  },
  {
    id: "mock-3",
    source: "mock",
    title: "Salmon Quinoa Plate",
    servings: 1,
    calories: 590,
    proteinG: 39,
    carbsG: 43,
    fatG: 27,
    ingredients: [
      { name: "Salmon", amount: 170, unit: "g" },
      { name: "Cooked quinoa", amount: 185, unit: "g" },
      { name: "Spinach", amount: 85, unit: "g" },
    ],
  },
  {
    id: "mock-4",
    source: "mock",
    title: "Turkey Chili",
    servings: 1,
    calories: 520,
    proteinG: 42,
    carbsG: 46,
    fatG: 17,
    ingredients: [
      { name: "Ground turkey", amount: 180, unit: "g" },
      { name: "Kidney beans", amount: 130, unit: "g" },
      { name: "Tomato", amount: 160, unit: "g" },
    ],
  },
];
