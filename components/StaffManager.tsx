"use client";

import { useEffect, useState } from "react";
import type { ManagedUser } from "@/lib/types";
import { api } from "@/lib/client";
import { ROLE_LABEL, STAFF_ROLES, type Role } from "@/lib/constants";

interface StaffManagerProps {
  open: boolean;
  onClose: () => void;
  /** Қызметкерлер тізімі өзгергенде (жаңа тізімді жоғарыға беру) */
  onChanged: (users: ManagedUser[]) => void;
}

/** Директордың қызметкерлерді басқару панелі (модаль) */
export default function StaffManager({ open, onClose, onChanged }: StaffManagerProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState<Role>("vice_principal");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    try {
      const { users } = await api.get<{ users: ManagedUser[] }>("/api/users");
      setUsers(users);
      onChanged(users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  useEffect(() => {
    if (open) {
      setError("");
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/users", { name, position, role, username, password });
      setName("");
      setPosition("");
      setUsername("");
      setPassword("");
      setRole("vice_principal");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  async function changeRole(id: string, newRole: string) {
    try {
      await api.patch(`/api/users/${id}`, { role: newRole });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  async function removeUser(id: string) {
    if (!confirm("Қызметкерді жоясыз ба? Оған бекітілген тапсырмалар бекітілмеген болады.")) return;
    try {
      await api.del(`/api/users/${id}`);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Қызметкерлерді басқару</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          {/* Жаңа қызметкер */}
          <form onSubmit={createStaff} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Жаңа қызметкер қосу</h3>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Аты-жөні"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Лауазымы (мыс. Информатика мұғалімі)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Логин"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Құпия сөз"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
            >
              Қосу
            </button>
          </form>

          {/* Бар қызметкерлер */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Қызметкерлер ({users.length})
            </h3>
            {users.length === 0 ? (
              <p className="text-sm text-slate-400">Әзірге қызметкер жоқ.</p>
            ) : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="truncate text-xs text-slate-500">{u.position}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">@{u.username}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUser(u.id)}
                        aria-label="Жою"
                        className="shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M7 3h6l1 2h3v2H3V5h3l1-2zm-2 5h10l-1 9a1 1 0 01-1 1H7a1 1 0 01-1-1L5 8z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
