import { useEffect, useState } from "react";
import Button from "./Button";
import AchievementBadge from "./AchievementBadge";

function parseW(str) {
  return parseFloat(String(str ?? "0").replace(",", ".")) || 0;
}

export default function WorkoutSummaryModal({
  exercises,
  data,
  lastWeights,
  newAchievements,
  onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Lille forsinkelse sikrer at CSS transitions kører
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const strengthExercises = exercises.filter((e) => e.type !== "plyo");

  const rows = strengthExercises.map((ex) => {
    const d = data[ex.id];
    const loggedWeight = d && d.sets.length > 0
      ? Math.max(...d.sets.map((s) => parseW(s.weight)))
      : 0;
    const prevWeight = lastWeights[ex.id] ?? null;
    const progressed = prevWeight != null && loggedWeight > prevWeight;
    return { ex, loggedWeight, prevWeight, progressed };
  });

  const progressedRows = rows.filter((r) => r.progressed);
  const otherRows = rows.filter((r) => !r.progressed);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
      <div
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Godt klaret! 💪</h2>
        <p className="text-slate-500 text-sm mb-5">Her er hvad du præsterede i dag.</p>

        {newAchievements.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
              Nye achievements
            </p>
            <div className="flex flex-col gap-2">
              {newAchievements.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 transition-all duration-300`}
                  style={{
                    transitionDelay: `${i * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <AchievementBadge
                    achievement={{ ...a, unlockedAt: new Date().toISOString() }}
                    size="sm"
                  />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">{a.title}</p>
                    <p className="text-amber-600 text-xs">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {progressedRows.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
              Fremgang
            </p>
            <div className="flex flex-col gap-2">
              {progressedRows.map(({ ex, loggedWeight, prevWeight }, i) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    transitionDelay: `${(newAchievements.length + i) * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="font-semibold text-slate-800 text-sm">{ex.name}</span>
                  <span className="text-emerald-600 font-bold text-sm">
                    {prevWeight} kg → {loggedWeight} kg ↑
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherRows.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Øvrige øvelser
            </p>
            <div className="flex flex-col gap-2">
              {otherRows.map(({ ex, loggedWeight }, i) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    transitionDelay: `${(newAchievements.length + progressedRows.length + i) * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="font-semibold text-slate-700 text-sm">{ex.name}</span>
                  <span className="text-slate-500 text-sm">{loggedWeight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onClose}>Fortsæt</Button>
      </div>
    </div>
  );
}
