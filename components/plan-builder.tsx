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

const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner", "Snack 1", "Snack 2", "Snack 3"];

function MacroBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-100">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MacroStat({
  label,
  value,
  target,
  unit,
  color,
  barColor,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  barColor: string;
}) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const diff = value - target;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</span>
        <span className="text-xs text-zinc-500">
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(0)}
          {unit}
        </span>
      </div>
      <p className="text-2xl font-bold text-zinc-900">
        {value.toFixed(0)}
        <span className="ml-1 text-sm font-normal text-zinc-500">{unit}</span>
      </p>
      <MacroBar value={pct} max={100} color={barColor} />
      <p className="text-xs text-zinc-400">target {target}{unit}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="mb-3 h-4 w-32 rounded bg-zinc-200" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-zinc-50 p-4">
            <div className="mb-2 h-4 w-48 rounded bg-zinc-200" />
            <div className="h-3 w-32 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
        setError("Failed to generate plan. Please try again.");
        return;
      }
      const data = (await response.json()) as PlanResponse;
      setPlan(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 w-full";

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">Macrobot</span>
          <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">beta</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Your personalized meal plan</h1>
          <p className="mt-1 text-zinc-500">Enter your daily targets and we'll build a plan around recipes that hit your macros.</p>
        </div>

        {/* Form card */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-zinc-800">Daily targets</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Calories
              <input type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Protein
              <div className="relative">
                <input type="number" value={proteinG} onChange={(e) => setProteinG(Number(e.target.value))} className={inputClass} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">g</span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Carbs
              <div className="relative">
                <input type="number" value={carbsG} onChange={(e) => setCarbsG(Number(e.target.value))} className={inputClass} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">g</span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Fat
              <div className="relative">
                <input type="number" value={fatG} onChange={(e) => setFatG(Number(e.target.value))} className={inputClass} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">g</span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Meals / day
              <input type="number" min={2} max={6} value={mealsPerDay} onChange={(e) => setMealsPerDay(Number(e.target.value))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Plan length
              <select value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value) as 1 | 7)} className={inputClass}>
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={generatePlan}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Build my plan
                </>
              )}
            </button>
            {plan && (
              <button
                type="button"
                onClick={generatePlan}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Refresh plan
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !plan && (
          <div className="grid gap-5">
            {Array.from({ length: horizonDays }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {plan && !loading && (
          <div className="grid gap-6">
            {/* Nutrition summary card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-base font-semibold text-zinc-800">
                {horizonDays === 7 ? "7-day" : "Daily"} nutrition summary
              </h3>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <MacroStat
                  label="Calories"
                  value={plan.totals.calories}
                  target={calories * horizonDays}
                  unit="kcal"
                  color="text-orange-500"
                  barColor="bg-orange-400"
                />
                <MacroStat
                  label="Protein"
                  value={plan.totals.proteinG}
                  target={proteinG * horizonDays}
                  unit="g"
                  color="text-blue-500"
                  barColor="bg-blue-400"
                />
                <MacroStat
                  label="Carbs"
                  value={plan.totals.carbsG}
                  target={carbsG * horizonDays}
                  unit="g"
                  color="text-amber-500"
                  barColor="bg-amber-400"
                />
                <MacroStat
                  label="Fat"
                  value={plan.totals.fatG}
                  target={fatG * horizonDays}
                  unit="g"
                  color="text-rose-500"
                  barColor="bg-rose-400"
                />
              </div>
            </div>

            {/* Day cards */}
            {[...byDay.entries()].map(([dayIndex, meals]) => (
              <div key={dayIndex} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                  <h3 className="font-semibold text-zinc-900">
                    {horizonDays === 1 ? "Today's meals" : `Day ${dayIndex + 1}`}
                  </h3>
                  <span className="text-xs text-zinc-400">{meals.length} meals</span>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {meals.map((meal) => (
                    <li key={`${meal.dayIndex}-${meal.mealIndex}`} className="px-6 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            {MEAL_LABELS[meal.mealIndex] ?? `Meal ${meal.mealIndex + 1}`}
                          </p>
                          <p className="mt-0.5 font-semibold text-zinc-900">{meal.recipe.title}</p>
                        </div>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                          {meal.recipe.calories.toFixed(0)} kcal
                        </span>
                      </div>

                      {/* Macro pills */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          P {meal.recipe.proteinG.toFixed(0)}g
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          C {meal.recipe.carbsG.toFixed(0)}g
                        </span>
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                          F {meal.recipe.fatG.toFixed(0)}g
                        </span>
                      </div>

                      {/* Ingredients */}
                      {meal.recipe.ingredients.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {meal.recipe.ingredients.slice(0, 6).map((ing, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600"
                            >
                              {ing.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Recipe link */}
                      <div className="mt-3 flex items-center justify-between">
                        <a
                          href={recipeLink(meal.recipe.title, meal.recipe.sourceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          {meal.recipe.sourceUrl ? "View recipe" : "Find recipe"}
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                        <span className="text-xs text-zinc-400">via {meal.recipe.source}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        Macrobot — recipes powered by Spoonacular
      </footer>
    </div>
  );
}
