import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" eller "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) {
          setMsg(error.message);
        } else {
          setMsg("Profil oprettet! Tjek din mail hvis Supabase kræver bekræftelse.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMsg(error.message);
        } else {
          setMsg("Logget ind!");
        }
      }
    } catch (err) {
      setMsg("Noget gik galt.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <div className="text-3xl font-black">
          {mode === "login" ? "Log ind" : "Opret profil"}
        </div>
        <div className="mt-2 text-white/70">
          {mode === "login"
            ? "Log ind og fortsæt din profil på alle maskiner."
            : "Lav en profil så dine data kan gemmes online."}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-sm text-white/80">Navn</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white"
                placeholder="Skriv dit navn"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-white/80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white"
              placeholder="dinmail@email.com"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Kodeord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white"
              placeholder="Mindst 6 tegn"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-extrabold text-slate-950 transition hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? "Vent..."
              : mode === "login"
              ? "Log ind"
              : "Opret profil"}
          </button>
        </form>

        {msg && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/85">
            {msg}
          </div>
        )}

        <div className="mt-5 text-sm text-white/70">
          {mode === "login" ? "Har du ikke en profil?" : "Har du allerede en profil?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMsg("");
            }}
            className="font-bold text-cyan-300 hover:underline"
          >
            {mode === "login" ? "Opret profil" : "Log ind"}
          </button>
        </div>
      </div>
    </div>
  );
}