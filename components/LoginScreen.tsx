"use client";

import { useState } from "react";
import type { AuthUser } from "@/lib/types";
import { api } from "@/lib/client";

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

/** Жүйеге кіру экраны — серверлік аутентификация арқылы */
export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api.post<{ user: AuthUser }>("/api/auth/login", {
        username,
        password,
      });
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Кіру қатесі");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid md:grid-cols-2">
        {/* Сол жақ: брендинг */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white md:flex">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3L2 8l10 5 8-4v6h2V8L12 3zM6 12.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3-6-3z" />
              </svg>
            </span>
            <h1 className="mt-6 text-2xl font-bold leading-tight">
              Мектеп тапсырмаларын басқару платформасы
            </h1>
            <p className="mt-3 text-sm text-indigo-100">
              Апталық жоспарлау, тапсырмаларды бөлу және орынбасарларға бекіту —
              бәрі бір жерде.
            </p>
          </div>
          <p className="text-xs text-indigo-200">
            © {new Date().getFullYear()} Мектеп басқару жүйесі
          </p>
        </div>

        {/* Оң жақ: кіру формасы */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900">Жүйеге кіру</h2>
          <p className="mt-1 text-sm text-slate-500">Аккаунтыңызбен кіріңіз</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Пайдаланушы аты
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Құпия сөз
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Кіру..." : "Кіру"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
