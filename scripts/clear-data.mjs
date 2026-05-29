// Engangs-oprydning: sletter alle workouts + sets (øvelser bevares).
// Kør: node scripts/clear-data.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { count: setsBefore } = await supabase
  .from("sets")
  .select("*", { count: "exact", head: true });
const { count: workoutsBefore } = await supabase
  .from("workouts")
  .select("*", { count: "exact", head: true });

const delSets = await supabase.from("sets").delete().gte("id", 0);
if (delSets.error) throw delSets.error;
const delWorkouts = await supabase.from("workouts").delete().gte("id", 0);
if (delWorkouts.error) throw delWorkouts.error;

const { count: setsAfter } = await supabase
  .from("sets")
  .select("*", { count: "exact", head: true });
const { count: workoutsAfter } = await supabase
  .from("workouts")
  .select("*", { count: "exact", head: true });

console.log(`sets:     ${setsBefore} -> ${setsAfter}`);
console.log(`workouts: ${workoutsBefore} -> ${workoutsAfter}`);
