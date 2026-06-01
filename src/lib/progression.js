// Pure progression rules. No I/O.

const DUMBBELL_EXERCISES = ["Lateral raises"];

export function incrementFor(exercise) {
  if (exercise.name === "Pull-ups") return 1.25;
  if (exercise.name.includes("DB") || DUMBBELL_EXERCISES.includes(exercise.name)) return 2;
  return exercise.type === "compound" ? 2.5 : 1.25;
}

// lastWorkSets: array of the two most recent work sets ({ reps, weight }) for
// this exercise, or empty/null when there is no history.
export function suggestWeight(exercise, lastWorkSets) {
  if (!lastWorkSets || lastWorkSets.length === 0) return null;
  const base = lastWorkSets[0].weight;
  const allHit = lastWorkSets.every((s) => s.reps >= 8);
  return allHit ? base + incrementFor(exercise) : base;
}

// Andel af arbejdsvægten brugt til det enkelte opvarmningssæt. ~50 % er det
// letteste ramp-sæt i gængse opvarmnings-protokoller (tom stang → ~50 % →
// ~75 % → ~90 % af arbejdsvægt). Se kilder i designdoc.
const WARMUP_RATIO = 0.5;

// Foreslået opvarmningsvægt ud fra den foreslåede arbejdsvægt.
// Rundes til nærmeste 2,5 kg (gængs vægtskive-increment). Null hvis ingen
// arbejdsvægt er kendt endnu.
export function warmupWeight(workingWeight) {
  if (workingWeight == null) return null;
  return Math.round((workingWeight * WARMUP_RATIO) / 2.5) * 2.5;
}
