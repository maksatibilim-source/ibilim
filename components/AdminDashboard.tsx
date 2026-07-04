"use client";

import { useEffect, useState } from "react";
import type { AdminSchool, AuthUser } from "@/lib/types";
import { api } from "@/lib/client";
import AppHeader from "./AppHeader";

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Жаңа мектеп формасы
  const [newName, setNewName] = useState("");

  async function refresh() {
    try {
      const { schools } = await api.get<{ schools: AdminSchool[] }>("/api/schools");
      setSchools(schools);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Жүктеу қатесі");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.post("/api/schools", { name: newName.trim() });
      setNewName("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  async function deleteSchool(id: string, name: string) {
    if (!confirm(`"${name}" мектебі және оның барлық қолданушылары мен тапсырмалары жойылады. Жалғастырасыз ба?`))
      return;
    try {
      await api.del(`/api/schools/${id}`);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 lg:px-8">
      <AppHeader user={user} onLogout={onLogout} subtitle="Жүйе әкімшісінің панелі" />

      {/* Жаңа мектеп ашу */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Жаңа мектеп ашу</h2>
        <form onSubmit={createSchool} className="flex flex-wrap gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Мектеп атауы (мыс. №25 мектеп-гимназия)"
            className="min-w-[260px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
          >
            Мектеп ашу
          </button>
        </form>
      </section>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Жүктелуде...</p>
      ) : schools.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Әзірге мектеп жоқ. Жоғарыдан жаңа мектеп ашыңыз.
        </p>
      ) : (
        <div className="space-y-4">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              onChanged={refresh}
              onDelete={() => deleteSchool(school.id, school.name)}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
//  Бір мектеп картасы: Sheets сілтемесі + директор тағайындау
// ----------------------------------------------------------------------------

function SchoolCard({
  school,
  onChanged,
  onDelete,
  onError,
}: {
  school: AdminSchool;
  onChanged: () => void;
  onDelete: () => void;
  onError: (m: string) => void;
}) {
  const director = school.users[0] ?? null;

  const [sheetUrl, setSheetUrl] = useState(school.sheetUrl ?? "");
  const [sheetRange, setSheetRange] = useState(school.sheetRange ?? "");
  const [yearStart, setYearStart] = useState(school.sheetYearStart ?? "2026-08-03");
  const [savedMsg, setSavedMsg] = useState("");
  const [importing, setImporting] = useState(false);

  // Директор тағайындау формасы
  const [dName, setDName] = useState("");
  const [dUser, setDUser] = useState("");
  const [dPass, setDPass] = useState("");

  // Бар директорды өзгерту формасы (жаңа директор ауысқанда)
  const [editDir, setEditDir] = useState(false);
  const [edName, setEdName] = useState("");
  const [edUser, setEdUser] = useState("");
  const [edPass, setEdPass] = useState("");

  function openEditDirector() {
    if (!director) return;
    setEdName(director.name);
    setEdUser(director.username);
    setEdPass("");
    setEditDir(true);
  }

  async function saveDirector(e: React.FormEvent) {
    e.preventDefault();
    if (!director) return;
    const payload: Record<string, string> = {};
    if (edName.trim()) payload.name = edName.trim();
    if (edUser.trim()) payload.username = edUser.trim();
    if (edPass.trim()) payload.password = edPass.trim();
    try {
      await api.patch(`/api/users/${director.id}`, payload);
      setEditDir(false);
      setEdPass("");
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Қате");
    }
  }

  async function saveSheet(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.patch(`/api/schools/${school.id}`, {
        sheetUrl,
        sheetRange,
        sheetYearStart: yearStart,
      });
      setSavedMsg("Сақталды ✓");
      setTimeout(() => setSavedMsg(""), 2000);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Қате");
    }
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // сол файлды қайта таңдауға мүмкіндік
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Тек сурет файлын таңдаңыз");
      return;
    }
    if (file.size > 300 * 1024) {
      onError("Логотип 300 КБ-тан аспасын (кішірек сурет таңдаңыз)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.patch(`/api/schools/${school.id}`, { logo: reader.result });
        onChanged();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Логотип жүктеу қатесі");
      }
    };
    reader.readAsDataURL(file);
  }

  async function removeLogo() {
    try {
      await api.patch(`/api/schools/${school.id}`, { logo: "" });
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Қате");
    }
  }

  async function importPlan() {
    setImporting(true);
    try {
      const { imported, weeks, skipped } = await api.post<{
        imported: number;
        weeks: number;
        skipped: number;
      }>("/api/import", { schoolId: school.id });
      const skipMsg = skipped > 0 ? ` ${skipped} қайталама өткізілді.` : "";
      alert(`"${school.name}": ${imported} тапсырма ${weeks} аптаға импортталды.${skipMsg}`);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Импорт қатесі");
    } finally {
      setImporting(false);
    }
  }

  async function assignDirector(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/api/users", {
        name: dName,
        username: dUser,
        password: dPass,
        schoolId: school.id,
      });
      setDName("");
      setDUser("");
      setDPass("");
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Қате");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Логотип превьюі */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {school.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logo} alt="Логотип" className="h-full w-full object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-300" aria-hidden="true">
                <path d="M12 3L2 8l10 5 8-4v6h2V8L12 3z" fill="currentColor" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {school.name}
            </h3>
            <p className="text-xs text-slate-400">
              {school._count.users} қолданушы · {school._count.tasks} тапсырма
            </p>
            <div className="mt-1 flex items-center gap-2">
              <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                Логотип жүктеу
                <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
              </label>
              {school.logo && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Өшіру
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
        >
          Мектепті жою
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Директор */}
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Директор</h4>
          {director ? (
            editDir ? (
              <form onSubmit={saveDirector} className="space-y-2">
                <p className="text-xs text-slate-500">
                  Директор ауысса — осы аккаунтты жаңа адамға өзгертіңіз (мектеп
                  деректері сақталады):
                </p>
                <input
                  value={edName}
                  onChange={(e) => setEdName(e.target.value)}
                  placeholder="Аты-жөні"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={edUser}
                    onChange={(e) => setEdUser(e.target.value)}
                    placeholder="Логин"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <input
                    value={edPass}
                    onChange={(e) => setEdPass(e.target.value)}
                    placeholder="Жаңа құпия сөз (қаласаңыз)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
                  >
                    Сақтау
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDir(false)}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                  >
                    Бас тарту
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{director.name}</span>
                  <span className="text-slate-400"> · @{director.username}</span>
                </p>
                <button
                  type="button"
                  onClick={openEditDirector}
                  className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white"
                >
                  Өзгерту
                </button>
              </div>
            )
          ) : (
            <form onSubmit={assignDirector} className="space-y-2">
              <p className="text-xs text-slate-500">Директор тағайындалмаған. Жаңа аккаунт жасаңыз:</p>
              <input
                value={dName}
                onChange={(e) => setDName(e.target.value)}
                placeholder="Аты-жөні"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={dUser}
                  onChange={(e) => setDUser(e.target.value)}
                  placeholder="Логин"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={dPass}
                  onChange={(e) => setDPass(e.target.value)}
                  placeholder="Құпия сөз"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
              >
                Директор тағайындау
              </button>
            </form>
          )}
        </div>

        {/* Google Sheets */}
        <form onSubmit={saveSheet} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Google Sheets (жылдық жоспар)
          </h4>
          <label className="mb-2 block">
            <span className="mb-1 block text-xs text-slate-500">
              Ашық сілтеме (барлар көре алатын)
            </span>
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Диапазон</span>
              <input
                value={sheetRange}
                onChange={(e) => setSheetRange(e.target.value)}
                placeholder="D2:P53"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">1-апта дүйсенбісі</span>
              <input
                type="date"
                value={yearStart}
                onChange={(e) => setYearStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          </div>
          <p className="mb-2 text-[11px] leading-snug text-slate-400">
            Әр жол — бір апта (1-жол = 1-апта). Тапсырмалар D бағанынан
            көлденеңінен: D2, E2, F2... Диапазон D бағанынан, апта жолынан
            басталсын.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
            >
              Сақтау
            </button>
            <button
              type="button"
              onClick={importPlan}
              disabled={importing || !school.sheetUrl}
              title={!school.sheetUrl ? "Алдымен сілтемені сақтаңыз" : "Жоспарды импорттау"}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? "Импортталуда..." : "Жоспарды импорттау"}
            </button>
            {savedMsg && <span className="text-xs font-medium text-emerald-600">{savedMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
