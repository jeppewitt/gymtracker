// Kladde for en igangværende træning.
//
// Mobil-browsere smider hele fanen ud af RAM når man skifter væk fra appen
// midt i en træning (fx for at tage tid eller svare på en besked). Uden en
// kladde starter React-state forfra, og alt det indtastede er væk. Vi gemmer
// derfor løbende i localStorage, som overlever at appen bliver genindlæst.
//
// Der er kun én kladde ad gangen — man træner én dag ad gangen.

const KEY = "gymtracker_workout_draft_v1";

// En kladde er kun relevant i den træning man er i gang med. Efter et døgn er
// den med sikkerhed levn fra en træning man alligevel afsluttede eller droppede.
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Læser kladden uanset dag. Returnerer null hvis der ingen er, hvis den er
// udløbet, eller hvis indholdet ikke kan læses (fx gemt af en ældre version).
export function loadAnyDraft(now = Date.now()) {
  let raw;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null; // localStorage utilgængelig (privat browsing e.l.)
  }
  if (!raw) return null;
  let draft;
  try {
    draft = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!draft || typeof draft !== "object") return null;
  if (!draft.day || !draft.data || !Array.isArray(draft.exercises)) return null;
  if (!(now - draft.updatedAt < DRAFT_MAX_AGE_MS)) {
    clearDraft();
    return null;
  }
  return draft;
}

// Læser kladden hvis den hører til den ønskede dag.
export function loadDraft(day, now = Date.now()) {
  const draft = loadAnyDraft(now);
  return draft && draft.day === day ? draft : null;
}

export function saveDraft(
  { day, exercises, data, selection, lastWeights, progressedBy },
  now = Date.now()
) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        day,
        exercises,
        data,
        selection: selection ?? {},
        lastWeights: lastWeights ?? {},
        progressedBy: progressedBy ?? {},
        updatedAt: now,
      })
    );
  } catch {
    // localStorage fuld eller utilgængelig — kladden er en bonus, ikke et krav
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorér stille
  }
}

// Har brugeren rent faktisk tastet noget? En kladde hvor kun de foreslåede
// vægte står, er ikke værd at tilbyde at fortsætte.
export function draftHasInput(draft) {
  if (!draft) return false;
  return Object.values(draft.data).some((d) =>
    (d?.sets ?? []).some((s) => String(s.reps ?? "").trim() !== "")
  );
}
