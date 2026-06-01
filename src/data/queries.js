import { supabase } from "../lib/supabase";

export async function fetchExercisesForDay(day) {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("day", day)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchAllExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("day", { ascending: true })
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createWorkout(day) {
  const { data, error } = await supabase
    .from("workouts")
    .insert({ day })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// rows: array of already snake_cased set objects
// ({ workout_id, exercise_id, set_number, is_warmup, reps, weight }).
export async function insertManySets(rows) {
  if (rows.length === 0) return;
  const { error } = await supabase.from("sets").insert(rows);
  if (error) throw error;
}

// Returns the work sets ([{reps, weight}]) from the most recent prior workout
// that logged this exercise, ordered by set_number. Empty if none.
export async function fetchLastWorkSets(exerciseId) {
  const { data, error } = await supabase
    .from("sets")
    .select("reps, weight, set_number, is_warmup, workout_id, created_at")
    .eq("exercise_id", exerciseId)
    .eq("is_warmup", false)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  if (!data || data.length === 0) return [];
  const latestWorkoutId = data[0].workout_id;
  return data
    .filter((s) => s.workout_id === latestWorkoutId)
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => ({ reps: s.reps, weight: Number(s.weight) }));
}

// History points: one entry per workout for an exercise, using the top work-set
// weight, ordered oldest-first for charting.
export async function fetchExerciseHistory(exerciseId) {
  const { data, error } = await supabase
    .from("sets")
    .select("reps, weight, set_number, is_warmup, workout_id, created_at")
    .eq("exercise_id", exerciseId)
    .eq("is_warmup", false)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const byWorkout = new Map();
  for (const s of data) {
    if (!byWorkout.has(s.workout_id)) {
      byWorkout.set(s.workout_id, {
        workoutId: s.workout_id,
        date: s.created_at,
        weight: Number(s.weight),
        sets: [],
      });
    }
    const entry = byWorkout.get(s.workout_id);
    entry.weight = Math.max(entry.weight, Number(s.weight));
    entry.sets.push({ setNumber: s.set_number, reps: s.reps });
  }
  return Array.from(byWorkout.values()).map((e) => ({
    ...e,
    sets: e.sets.sort((a, b) => a.setNumber - b.setNumber),
  }));
}

// Returnerer det totale antal workouts i databasen.
export async function fetchWorkoutCount() {
  const { count, error } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
