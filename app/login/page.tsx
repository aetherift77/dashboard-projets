"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LoaderCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = params.get("from");
        router.replace(from && from.startsWith("/") ? from : "/");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Échec de la connexion");
    } catch {
      setError("Erreur réseau, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-600/40 flex items-center justify-center">
            <Lock size={22} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold mt-1">⚡ Aether Dashboard</h1>
          <p className="text-sm text-zinc-400">Accès protégé</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm text-zinc-400 mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 outline-none transition-colors focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 font-medium transition-colors"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" />}
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams() impose une frontière Suspense pour le rendu statique (Next.js App Router).
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
