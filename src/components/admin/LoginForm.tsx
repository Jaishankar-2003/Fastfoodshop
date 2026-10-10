"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { signInAction, signUpAction } from "@/app/admin/actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("test12");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setup = searchParams.get("setup") === "1";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Add Supabase environment variables before signing in.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await signUpAction(email, password);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.unconfirmed) {
          setError(res.message);
          return;
        }
      } else {
        const res = await signInAction(email, password);
        if (res.error) {
          setError(res.error);
          return;
        }
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {setup ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configure `.env.local` with your Supabase project keys to enable admin login.
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-12 w-full rounded-2xl bg-card px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-12 w-full rounded-2xl bg-card px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand font-bold text-white disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <button
        type="button"
        className="w-full text-sm font-semibold text-muted"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "New shop owner? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
