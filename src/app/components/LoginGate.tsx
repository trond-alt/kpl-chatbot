"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "kpl-access-token";

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (token === "authenticated") {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });

    if (res.ok) {
      sessionStorage.setItem(STORAGE_KEY, "authenticated");
      setAuthenticated(true);
    } else {
      setError("Feil tilgangskode. Prøv igjen.");
    }
  }

  if (checking) return null;

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ba-light)]">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--ba-blue)]">
            Boreakademiet
          </h1>
          <p className="text-gray-600 mt-1">Fagassistent kjemiprosess- og laboratoriefag vg2</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tilgangskode
            </label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Skriv inn koden du har fått"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ba-blue)]/30 focus:border-[var(--ba-blue)]"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--ba-blue)] text-white py-2.5 rounded-lg font-medium hover:bg-[var(--ba-blue)]/90 transition-colors"
          >
            Logg inn
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Kontakt kursansvarlig om du ikke har tilgangskode
        </p>
      </div>
    </div>
  );
}
