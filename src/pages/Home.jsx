import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const DAYS = [
  { key: "mon", label: "Mandag" },
  { key: "wed", label: "Onsdag" },
  { key: "fri", label: "Fredag" },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 h-full justify-center px-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Vælg træningsdag</h1>
      {DAYS.map((d) => (
        <Button key={d.key} onClick={() => navigate(`/workout/${d.key}`)}>
          {d.label}
        </Button>
      ))}
      <Button variant="surface" className="mt-6" onClick={() => navigate("/history")}>
        Historik
      </Button>
    </div>
  );
}
