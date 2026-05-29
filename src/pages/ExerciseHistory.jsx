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
    date: new Date(h.date).toLocaleDateString("da-DK", {
      day: "2-digit",
      month: "2-digit",
    }),
    weight: h.weight,
  }));

  return (
    <div className="px-5 pt-12 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/history")} className="text-slate-400 text-lg">
          ←
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900">{name}</h1>
      </div>
      {error && <p className="text-red-500">Fejl: {error}</p>}

      {chartData.length === 0 ? (
        <p className="text-slate-400">Ingen logget historik endnu.</p>
      ) : (
        <>
          <div className="h-56 mb-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} width={32} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  labelStyle={{ color: "#64748b" }}
                  formatter={(v) => [formatKg(v), "vægt"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#7c3aed" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            {[...history].reverse().map((h) => (
              <div
                key={h.workoutId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex justify-between items-center"
              >
                <span className="text-slate-500">
                  {new Date(h.date).toLocaleDateString("da-DK")}
                </span>
                <span className="font-semibold text-slate-800">
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
