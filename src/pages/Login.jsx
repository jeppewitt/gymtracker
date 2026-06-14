import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | verifying | error
  const [error, setError] = useState(null);

  async function sendCode(e) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("idle");
      setStep("code");
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setStatus("verifying");
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    }
    // Ved succes: onAuthStateChange sætter sessionen, og App redirecter selv.
  }

  return (
    <div className="min-h-full px-5 pt-24 pb-10 max-w-md mx-auto flex flex-col">
      <p className="text-slate-400 font-medium mb-1">Velkommen</p>
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
        Log ind
      </h1>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
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
            {status === "sending" ? "Sender…" : "Send mig en kode"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-slate-400 text-sm text-center">
            Første gang? Din konto oprettes automatisk.
          </p>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <p className="text-slate-500">
            Vi har sendt en kode til{" "}
            <span className="font-semibold">{email}</span>. Skriv den her:
          </p>
          <input
            type="text"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-2xl tracking-[0.4em] text-center text-slate-900 outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={status === "verifying" || code.length < 6}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl px-5 py-4 text-lg font-bold active:scale-[0.99] transition disabled:opacity-60"
          >
            {status === "verifying" ? "Logger ind…" : "Log ind"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-indigo-500 font-semibold py-2"
          >
            ← Skift email
          </button>
        </form>
      )}
    </div>
  );
}
