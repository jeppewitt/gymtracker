import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import History from "./pages/History";
import ExerciseHistory from "./pages/ExerciseHistory";
import WorkoutLog from "./pages/WorkoutLog";
import WorkoutLogEdit from "./pages/WorkoutLogEdit";
import Achievements from "./pages/Achievements";

function ProtectedLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-slate-400">
        Indlæser…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  const { session, loading } = useAuth();
  return (
    <div className="h-full">
      <Routes>
        <Route
          path="/login"
          element={
            loading ? null : session ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/workout/:day" element={<Workout />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:exerciseId" element={<ExerciseHistory />} />
          <Route path="/workouts" element={<WorkoutLog />} />
          <Route path="/workouts/:workoutId" element={<WorkoutLogEdit />} />
          <Route path="/achievements" element={<Achievements />} />
        </Route>
      </Routes>
    </div>
  );
}
