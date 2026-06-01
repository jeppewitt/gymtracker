import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllWorkouts } from "../data/queries";

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function WorkoutLog() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllWorkouts()
      .then(setWorkouts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-5 pt-12 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/")} className="text-slate-400 text-lg">
          ←
        </button>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Gennemførte træninger
        </h1>
      </div>

      {loading && <p className="text-slate-400">Indlæser…</p>}
      {error && <p className="text-red-500">Fejl: {error}</p>}

      {!loading && workouts.length === 0 && (
        <p className="text-slate-400">Ingen træninger endnu.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {workouts.map((w) => (
          <button
            key={w.id}
            onClick={() => navigate(`/workouts/${w.id}`)}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-left flex items-center justify-between active:scale-[0.99] transition"
          >
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {DAY_LABELS[w.day] ?? w.day}
              </p>
              <p className="text-sm text-slate-400">{formatDate(w.created_at)}</p>
            </div>
            <span className="text-slate-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
