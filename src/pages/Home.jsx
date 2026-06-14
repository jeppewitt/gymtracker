import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const DAYS = [
  { key: "mon", label: "Mandag", sub: "Bænk · squat · ro" },
  { key: "wed", label: "Onsdag", sub: "Bænk · markløft · pull-ups" },
  { key: "fri", label: "Fredag", sub: "Press · ro · hip thrust" },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full px-5 pt-16 pb-10 max-w-md mx-auto flex flex-col">
      <p className="text-slate-400 font-medium mb-1">Lad os træne</p>
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
        Vælg dag
      </h1>

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
