import { useState } from "react";
import Button from "./Button";
import RepInput from "./RepInput";
import { formatKg } from "../lib/format";

const TYPE_LABEL = { compound: "Compound", isolation: "Isolation" };

// props:
//   exercise         - { id, name, type }
//   suggestedWeight  - number | null (null => no history, user enters weight)
//   onWarmup(weight)                   - logs warmup
//   onWorkSet(setNumber, reps, weight) - logs a work set
//   onComplete()                       - advance to next exercise
export default function StrengthCard({
  exercise,
  suggestedWeight,
  onWarmup,
  onWorkSet,
  onComplete,
}) {
  const hasHistory = suggestedWeight !== null;
  const [phase, setPhase] = useState(hasHistory ? "weight" : "enterWeight");
  const [weight, setWeight] = useState(hasHistory ? suggestedWeight : 0);
  const [weightInput, setWeightInput] = useState("");
  const [reps, setReps] = useState(8);

  const confirmEnteredWeight = () => {
    const w = Number(weightInput.replace(",", "."));
    if (Number.isNaN(w)) return;
    setWeight(w);
    setPhase("weight");
  };

  const startWarmup = () => {
    onWarmup(weight);
    setPhase("work1");
  };

  const submitWork = (setNumber) => {
    onWorkSet(setNumber, reps, weight);
    if (setNumber === 1) {
      setReps(8);
      setPhase("work2");
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full justify-center px-6">
      <div className="text-center">
        <p className="text-accent text-sm uppercase tracking-widest mb-2">
          {TYPE_LABEL[exercise.type] ?? exercise.type}
        </p>
        <h1 className="text-4xl font-bold">{exercise.name}</h1>
      </div>

      {phase === "enterWeight" && (
        <div className="flex flex-col gap-6">
          <p className="text-center text-gray-400 text-lg">Indtast startvægt (kg)</p>
          <input
            inputMode="decimal"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="0"
            className="w-full text-center text-6xl font-bold bg-surface rounded-2xl py-6 outline-none"
          />
          <Button onClick={confirmEnteredWeight}>Bekræft vægt</Button>
        </div>
      )}

      {phase === "weight" && (
        <div className="flex flex-col gap-6">
          <p className="text-center text-gray-400 text-lg">Foreslået vægt</p>
          <p className="text-center text-7xl font-bold">{formatKg(weight)}</p>
          <Button onClick={startWarmup}>Warmup færdig</Button>
        </div>
      )}

      {(phase === "work1" || phase === "work2") && (
        <div className="flex flex-col gap-8">
          <p className="text-center text-gray-400 text-lg">
            Arbejdssæt {phase === "work1" ? 1 : 2} · {formatKg(weight)} · reps til failure
          </p>
          <RepInput value={reps} onChange={setReps} />
          <Button onClick={() => submitWork(phase === "work1" ? 1 : 2)}>
            Gem sæt {phase === "work1" ? 1 : 2}
          </Button>
        </div>
      )}
    </div>
  );
}
