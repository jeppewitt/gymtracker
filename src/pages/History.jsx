import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllExercises } from "../data/queries";
import { groupVariants } from "../lib/variants";

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

export default function History() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllExercises()
      .then((list) => setExercises(list.filter((e) => e.type !== "plyo")))
      .catch((e) => setError(e.message));
  }, []);

  // Varianter (fx dødløft under romanian deadlift) har egen historik, men
  // hører visuelt sammen med hovedøvelsen — derfor lister vi dem lige under.
  const byDay = ["mon", "wed", "fri"].map((day) => ({
    day,
    items: groupVariants(exercises.filter((e) => e.day === day)).flatMap(
      ({ variants }) =>
        variants.map((e, i) => ({ ...e, isVariant: i > 0 }))
    ),
  }));

  return (
    <div className="px-5 pt-12 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/")} className="text-slate-400 text-lg">
          ←
        </button>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Historik
        </h1>
      </div>
      {error && <p className="text-red-500">Fejl: {error}</p>}
      {byDay.map(({ day, items }) => (
        <div key={day} className="mb-7">
          <h2 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">
            {DAY_LABELS[day]}
          </h2>
          <div className="flex flex-col gap-2.5">
            {items.map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/history/${e.id}`)}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-left text-lg font-medium text-slate-800 flex items-center justify-between gap-3 active:scale-[0.99] transition ${
                  e.isVariant ? "ml-5" : ""
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{e.name}</span>
                  {e.isVariant && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                      variant
                    </span>
                  )}
                </span>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
