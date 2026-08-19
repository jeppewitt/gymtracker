import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getAchievementList } from "../lib/achievements";
import { loadAnyDraft, draftHasInput, clearDraft } from "../lib/workoutDraft";
import AchievementBadge from "../components/AchievementBadge";

const DAYS = [
  { key: "mon", label: "Mandag", sub: "Bænk · squat · ro" },
  { key: "wed", label: "Onsdag", sub: "Bænk · markløft · pull-ups" },
  { key: "fri", label: "Fredag", sub: "Press · ro · hip thrust" },
];

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

// "kl. 17.42" hvis kladden er fra i dag, ellers dato + tid.
function formatSaved(ts) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `kl. ${time}` : `${d.toLocaleDateString("da-DK")} ${time}`;
}

export default function Home() {
  const navigate = useNavigate();
  const achievements = useMemo(() => getAchievementList(), []);
  // Kladde fra en træning der blev afbrudt (fx fordi mobilen ryddede appen
  // ud af hukommelsen). Vi tilbyder at fortsætte i stedet for at starte forfra.
  const [draft, setDraft] = useState(() => {
    const d = loadAnyDraft();
    return draftHasInput(d) ? d : null;
  });
  const unlocked = achievements.filter((a) => a.unlockedAt);
  // Nyeste tre badges som teaser på forsiden; er intet låst op, viser vi
  // de tre første som låste skiver, så man kan se der er noget at jagte.
  const preview =
    unlocked.length > 0
      ? [...unlocked]
          .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
          .slice(0, 3)
      : achievements.slice(0, 3);

  return (
    <div className="min-h-full px-5 pt-16 pb-10 max-w-md mx-auto flex flex-col">
      <p className="text-slate-400 font-medium mb-1">Lad os træne</p>
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
        Vælg dag
      </h1>

      {draft && (
        <div className="mb-4 rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-lg font-bold text-indigo-900">Træning i gang</p>
          <p className="text-indigo-500 text-sm mb-4">
            {DAY_LABELS[draft.day] ?? draft.day} · gemt {formatSaved(draft.updatedAt)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/workout/${draft.day}`)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 active:scale-[0.99] transition"
            >
              Fortsæt
            </button>
            <button
              onClick={() => {
                clearDraft();
                setDraft(null);
              }}
              className="rounded-2xl border border-indigo-200 text-indigo-500 font-semibold px-4 py-3"
            >
              Kassér
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => navigate(`/workout/${d.key}`)}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left flex items-center justify-between active:scale-[0.99] transition"
          >
            <div>
              <p className="text-2xl font-bold text-slate-900">{d.label}</p>
              <p className="text-slate-400">{d.sub}</p>
            </div>
            <span className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xl">
              →
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/achievements")}
        className="mt-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 text-left flex items-center justify-between gap-3 active:scale-[0.99] transition"
      >
        <div>
          <p className="text-lg font-bold text-slate-900">Badges</p>
          <p className="text-slate-400 text-sm">
            {unlocked.length} af {achievements.length} låst op
          </p>
        </div>
        <div className="flex -space-x-3 shrink-0">
          {preview.map((a) => (
            <AchievementBadge key={a.id} achievement={a} size="sm" />
          ))}
        </div>
      </button>

      <button
        onClick={() => navigate("/workouts")}
        className="mt-6 text-indigo-500 font-semibold py-3"
      >
        Gennemførte træninger →
      </button>

      <button
        onClick={() => navigate("/history")}
        className="mt-2 text-indigo-500 font-semibold py-3"
      >
        Se historik →
      </button>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-8 text-slate-400 font-medium py-3"
      >
        Log ud
      </button>
    </div>
  );
}
