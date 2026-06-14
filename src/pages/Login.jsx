import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-full px-5 pt-24 pb-10 max-w-md mx-auto flex flex-col">
      <p className="text-slate-400 font-medium mb-1">Velkommen</p>
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
        Log ind
      </h1>

      {status === "sent" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <p className="text-2xl font-bold text-slate-900 mb-2">Tjek din mail 📬</p>
          <p className="text-slate-500">
            Vi har sendt et login-link til <span className="font-semibold">{email}</span>.
            Klik på linket for at komme ind.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 text-indigo-500 font-semibold"
          >
            Brug en anden email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@email.dk"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-lg text-slate-900 outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl px-5 py-4 text-lg font-bold active:scale-[0.99] transition disabled:opacity-60"
          >
            {status === "sending" ? "Sender…" : "Send mig et login-link"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-slate-400 text-sm text-center">
            Første gang? Din konto oprettes automatisk.
          </p>
        </form>
      )}
    </div>
  );
}
