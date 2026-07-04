"use client";

import type { AuthUser } from "@/lib/types";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import ThemeToggle from "./ThemeToggle";

interface AppHeaderProps {
  user: AuthUser;
  subtitle?: string;
  onLogout: () => void;
  /** Оң жақта қосымша басқару элементтері (батырмалар) */
  children?: React.ReactNode;
}

/** Барлық панельдерге ортақ хедер: логотип + мектеп атауы + профиль */
export default function AppHeader({ user, subtitle, onLogout, children }: AppHeaderProps) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const roleLabel = ROLE_LABEL[user.role as Role] ?? user.role;
  const school = user.school;

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between dark:border-slate-700/60 dark:bg-slate-900/60">
      {/* Сол жақ: логотип + мектеп атауы */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
          {school?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo} alt="Логотип" className="h-full w-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3L2 8l10 5 8-4v6h2V8L12 3zM6 12.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3-6-3z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 lg:text-2xl dark:text-white">
            {school ? school.name : "Мектеп платформасы"}
          </h1>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {subtitle ?? (school ? "Апталық жоспарлау тақтасы" : roleLabel)}
          </p>
        </div>
      </div>

      {/* Оң жақ: батырмалар + тема + профиль */}
      <div className="flex flex-wrap items-center gap-3">
        {children}

        <ThemeToggle />

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            {initials}
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">
              {user.name}
            </p>
            <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Шығу"
            title="Шығу"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
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
