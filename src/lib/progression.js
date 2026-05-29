// Pure progression rules. No I/O.

export function incrementFor(exercise) {
  if (exercise.name === "Pull-ups") return 1.25;
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
