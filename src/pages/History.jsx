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
    <div className="px-6 py-4 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/")} className="text-gray-400">
          ← Tilbage
        </button>
        <h1 className="text-2xl font-bold">Historik</h1>
      </div>
      {error && <p className="text-red-400">Fejl: {error}</p>}
      {byDay.map(({ day, items }) => (
        <div key={day} className="mb-6">
          <h2 className="text-accent text-sm uppercase tracking-widest mb-2">
            {DAY_LABELS[day]}
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/history/${e.id}`)}
                className="bg-surface rounded-xl px-4 py-4 text-left text-lg active:scale-[0.99]"
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
