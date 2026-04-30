"use client";

import { useMemo, useState } from "react";

type PlanResponse = {
  meals: Array<{
    dayIndex: number;
    mealIndex: number;
    recipe: {
      title: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      source: "spoonacular" | "edamam" | "mock";
      sourceUrl?: string;
      ingredients: Array<{
        name: string;
        amount: number;
        unit?: string;
      }>;
    };
  }>;
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  deviation: {
    caloriesPct: number;
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
};

export function PlanBuilder() {
  const [calories, setCalories] = useState(2200);
  const [proteinG, setProteinG] = useState(180);
  const [carbsG, setCarbsG] = useState(220);
  const [fatG, setFatG] = useState(70);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [horizonDays, setHorizonDays] = useState<1 | 7>(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function recipeLink(title: string, sourceUrl?: string): string {
    if (sourceUrl) return sourceUrl;
    return `https://www.google.com/search?q=${encodeURIComponent(`${title} recipe`)}`;
  }

  const byDay = useMemo(() => {
    if (!plan) return new Map<number, PlanResponse["meals"]>();
    const map = new Map<number, PlanResponse["meals"]>();
    for (const meal of plan.meals) {
      const day = map.get(meal.dayIndex) ?? [];
      day.push(meal);
      map.set(meal.dayIndex, day);
    }
    return map;
  }, [plan]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await generatePlan();
  }

  async function generatePlan() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horizonDays,
          mealsPerDay,
          targets: { calories, proteinG, carbsG, fatG },
          refreshToken: Date.now(),
        }),
      });

      if (!response.ok) {
        setError("Failed to generate plan.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as PlanResponse;
      setPlan(data);
    } catch {
      setError("Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-xl font-semibold">Meal Planner Inputs</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Calories
            <input type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Protein (g)
            <input type="number" value={proteinG} onChange={(e) => setProteinG(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Carbs (g)
            <input type="number" value={carbsG} onChange={(e) => setCarbsG(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fat (g)
            <input type="number" value={fatG} onChange={(e) => setFatG(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Meals / day
            <input type="number" min={2} max={6} value={mealsPerDay} onChange={(e) => setMealsPerDay(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Horizon
            <select value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value) as 1 | 7)} className="rounded-md border border-zinc-300 px-3 py-2">
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded-full bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate plan"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {plan ? (
        <section className="grid gap-6">
          <div className="rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-lg font-semibold">Nutrition totals</h3>
            <p className="mt-2 text-sm">
              Calories {plan.totals.calories.toFixed(0)} | Protein {plan.totals.proteinG.toFixed(0)}g |
              Carbs {plan.totals.carbsG.toFixed(0)}g | Fat {plan.totals.fatG.toFixed(0)}g
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Deviation: cal {plan.deviation.caloriesPct.toFixed(1)}%, protein{" "}
              {plan.deviation.proteinPct.toFixed(1)}%, carbs {plan.deviation.carbsPct.toFixed(1)}%, fat{" "}
              {plan.deviation.fatPct.toFixed(1)}%
            </p>
          </div>

          <button
            type="button"
            onClick={generatePlan}
            disabled={loading}
            className="w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh plan"}
          </button>

          {[...byDay.entries()].map(([dayIndex, meals]) => (
            <div key={dayIndex} className="rounded-2xl border border-zinc-200 p-6">
              <h3 className="text-lg font-semibold">Day {dayIndex + 1}</h3>
              <ul className="mt-3 grid gap-3">
                {meals.map((meal) => (
                  <li key={`${meal.dayIndex}-${meal.mealIndex}`} className="rounded-lg bg-zinc-50 p-3">
                    <p className="font-medium">
                      Meal {meal.mealIndex + 1}: {meal.recipe.title}
                    </p>
                    <p className="text-sm text-zinc-700">
                      {meal.recipe.calories.toFixed(0)} kcal | P {meal.recipe.proteinG.toFixed(0)} / C{" "}
                      {meal.recipe.carbsG.toFixed(0)} / F {meal.recipe.fatG.toFixed(0)}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700">
                      Key ingredients:{" "}
                      {meal.recipe.ingredients.slice(0, 5).map((ingredient) => ingredient.name).join(", ")}
                    </p>
                    <a
                      href={recipeLink(meal.recipe.title, meal.recipe.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
                    >
                      {meal.recipe.sourceUrl ? "View full recipe" : "Find full recipe instructions"}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">Source: {meal.recipe.source}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
