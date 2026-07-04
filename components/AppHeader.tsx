"use client";

import type { AuthUser } from "@/lib/types";
import { ROLE_LABEL, type Role } from "@/lib/constants";

interface AppHeaderProps {
  user: AuthUser;
  subtitle?: string;
  onLogout: () => void;
  /** Оң жақта қосымша басқару элементтері (батырмалар) */
  children?: React.ReactNode;
}

/** Барлық панельдерге ортақ хедер: тақырып + профиль + шығу */
export default function AppHeader({ user, subtitle, onLogout, children }: AppHeaderProps) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const roleLabel = ROLE_LABEL[user.role as Role] ?? user.role;

  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">
          Мектеп тапсырмалар платформасы
        </h1>
        <p className="text-sm text-slate-500">
          {subtitle ?? (user.school ? user.school.name : roleLabel)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {children}

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {initials}
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800">{user.name}</p>
            <p className="text-xs leading-tight text-slate-500">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Шығу"
            title="Шығу"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9 3H5a2 2 0 00-2 2v10a2 2 0 002 2h4v-2H5V5h4V3zm4.5 3.5L12 8l1 1h-6v2h6l-1 1 1.5 1.5L17 10l-3.5-3.5z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
