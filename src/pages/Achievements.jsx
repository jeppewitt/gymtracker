import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAchievementList, CATEGORIES } from "../lib/achievements";
import AchievementBadge from "../components/AchievementBadge";
import Button from "../components/Button";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Achievements() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const list = useMemo(() => getAchievementList(), []);

  const unlockedCount = list.filter((a) => a.unlockedAt).length;
  const pct = Math.round((unlockedCount / list.length) * 100);

  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: list.filter((a) => a.category === c.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="px-5 pt-12 pb-16 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 text-lg"
          aria-label="Tilbage"
        >
          ←
        </button>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Badges
        </h1>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-5 py-4 mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-slate-800 font-semibold">
            {unlockedCount} af {list.length} låst op
          </p>
          <p className="text-slate-400 text-sm font-medium">{pct}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <section key={g.id}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              {g.label}
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-6">
              {g.items.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="flex flex-col items-center text-center active:scale-95 transition"
                >
                  <AchievementBadge achievement={a} />
                  <p
                    className={`mt-2 text-xs font-semibold leading-tight ${
                      a.unlockedAt ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {a.title}
                  </p>
                  {a.unlockedAt && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(a.unlockedAt)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <AchievementDetail
          achievement={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function AchievementDetail({ achievement, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Lille forsinkelse sikrer at CSS transitions kører
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-center transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex justify-center mb-5">
          <div
            className={`transition-all duration-500 ${
              visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <AchievementBadge achievement={achievement} size="lg" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
          {achievement.title}
        </h2>
        <p className="text-slate-500 mb-4">{achievement.description}</p>

        {achievement.unlockedAt ? (
          <p className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-full px-4 py-1.5 mb-6">
            Låst op {formatDate(achievement.unlockedAt)}
          </p>
        ) : (
          <p className="inline-block bg-slate-100 text-slate-500 text-sm font-semibold rounded-full px-4 py-1.5 mb-6">
            Ikke låst op endnu
          </p>
        )}

        <Button onClick={onClose}>Luk</Button>
      </div>
    </div>
  );
}
