import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import History from "./pages/History";
import ExerciseHistory from "./pages/ExerciseHistory";

export default function App() {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout/:day" element={<Workout />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:exerciseId" element={<ExerciseHistory />} />
      </Routes>
    </div>
  );
}
