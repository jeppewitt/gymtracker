import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { fetchExerciseHistory, fetchAllExercises } from "../data/queries";
import { formatKg } from "../lib/format";

export default function ExerciseHistory() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = Number(exerciseId);
    Promise.all([fetchExerciseHistory(id), fetchAllExercises()])
      .then(([hist, all]) => {
        setHistory(hist);
        const found = all.find((e) => e.id === id);
        setName(found ? found.name : "Øvelse");
      })
      .catch((e) => setError(e.message));
  }, [exerciseId]);

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" }),
    weight: h.weight,
  }));

  return (
    <div className="px-6 py-4 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/history")} className="text-gray-400">
          ← Tilbage
        </button>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>
      {error && <p className="text-red-400">Fejl: {error}</p>}

      {chartData.length === 0 ? (
        <p className="text-gray-400">Ingen logget historik endnu.</p>
      ) : (
        <>
          <div className="h-56 mb-8 bg-surface rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2a2a2e" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} width={32} />
                <Tooltip
                  contentStyle={{ background: "#161618", border: "none", borderRadius: 8 }}
                  formatter={(v) => formatKg(v)}
                />
                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            {[...history].reverse().map((h) => (
              <div
                key={h.workoutId}
                className="bg-surface rounded-xl px-4 py-3 flex justify-between"
              >
                <span className="text-gray-300">
                  {new Date(h.date).toLocaleDateString("da-DK")}
                </span>
                <span>
                  {formatKg(h.weight)} · {h.sets.map((s) => s.reps).join(" / ")} reps
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
