import { z } from "zod";
import { fetchFromConfiguredProviders } from "@/lib/recipes/providers";
import { buildMealPlan } from "@/lib/planner/selection";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/prisma";

const planRequestSchema = z.object({
  horizonDays: z.union([z.literal(1), z.literal(7)]),
  mealsPerDay: z.number().int().min(2).max(6),
  targets: z.object({
    calories: z.number().positive(),
    proteinG: z.number().positive(),
    carbsG: z.number().positive(),
    fatG: z.number().positive(),
  }),
  preferences: z
    .object({
      diet: z.string().optional(),
      cuisine: z.string().optional(),
      excludeIngredients: z.array(z.string()).optional(),
    })
    .optional(),
  refreshToken: z.number().optional(),
});

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = planRequestSchema.parse(body);

    const neededCandidates = Math.max(20, parsed.mealsPerDay * parsed.horizonDays * 3);
    const providerData = await fetchFromConfiguredProviders({
      count: neededCandidates,
      preferences: parsed.preferences,
    });
    const shuffleSeed = parsed.refreshToken ?? Date.now();
    const candidates = shuffleWithSeed(providerData.recipes, shuffleSeed);

    const plan = buildMealPlan(parsed, candidates);

    let persistedPlanId: string | null = null;
    if (hasDatabaseConfig()) {
      try {
        const prisma = getPrismaClient();
        const created = await prisma.plan.create({
          data: {
            horizonDays: parsed.horizonDays,
            mealsPerDay: parsed.mealsPerDay,
            targetCalories: parsed.targets.calories,
            targetProteinG: parsed.targets.proteinG,
            targetCarbsG: parsed.targets.carbsG,
            targetFatG: parsed.targets.fatG,
            meals: {
              create: plan.meals.map((meal) => ({
                dayIndex: meal.dayIndex,
                mealIndex: meal.mealIndex,
                recipeExternalId: meal.recipe.id,
                recipeTitle: meal.recipe.title,
                calories: meal.recipe.calories,
                proteinG: meal.recipe.proteinG,
                carbsG: meal.recipe.carbsG,
                fatG: meal.recipe.fatG,
                servings: meal.recipe.servings,
              })),
            },
          },
        });
        persistedPlanId = created.id;
      } catch {
        // Persisting plans is optional during initial setup.
      }
    }

    return Response.json({
      ...plan,
      persistedPlanId,
      sourceTelemetry: providerData.telemetry,
      usedFallbackRecipes: providerData.usedFallback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.flatten() }, { status: 400 });
    }
    return Response.json({ error: "Could not create meal plan" }, { status: 500 });
  }
}
