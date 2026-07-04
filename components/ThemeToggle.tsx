"use client";

import { useEffect, useState } from "react";

/** Күн/түн режимін ауыстыратын батырма */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    if (next) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* елемейміз */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Тема ауыстыру"
      title={dark ? "Күндізгі режим" : "Түнгі режим"}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-xl border transition",
        "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
        className,
      ].join(" ")}
    >
      {mounted && dark ? (
        // Күн иконкасы (түнгі режимде — күндізгіге ауысу)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Ай иконкасы (күндізгі режимде — түнгіге ауысу)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
