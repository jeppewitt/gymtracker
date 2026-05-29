import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllExercises } from "../data/queries";

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

  const byDay = ["mon", "wed", "fri"].map((day) => ({
    day,
    items: exercises.filter((e) => e.day === day),
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
                className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-left text-lg font-medium text-slate-800 flex items-center justify-between active:scale-[0.99] transition"
              >
                {e.name}
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
