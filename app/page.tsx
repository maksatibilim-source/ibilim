"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/types";
import { api } from "@/lib/client";
import LoginScreen from "@/components/LoginScreen";
import AdminDashboard from "@/components/AdminDashboard";
import Planner from "@/components/Planner";

export default function Page() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Ағымдағы сессияны тексеру
  useEffect(() => {
    api
      .get<{ user: AuthUser | null }>("/api/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* елемейміз */
    }
    setUser(null);
  }

  // Жүктелгенше — бос экран
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-400">
        Жүктелуде...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  if (user.role === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Директор немесе қызметкер
  if (!user.schoolId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
        <p className="text-sm text-slate-600">
          Сізге әлі мектеп тағайындалмаған. Әкімшіге хабарласыңыз.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Шығу
        </button>
      </div>
    );
  }

  return <Planner user={user} onLogout={handleLogout} />;
}
