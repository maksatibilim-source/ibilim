// ============================================================================
//  Ортақ константалар: рөлдер, бағандар, тапсырма түрлері мен күйлері
//  (Client пен серверде бірдей қолданылады)
// ============================================================================

import type { ColumnId } from "./types";

export const ROLES = {
  ADMIN: "admin",
  DIRECTOR: "director",
  VICE_PRINCIPAL: "vice_principal",
  TEACHER: "teacher",
  STAFF: "staff",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Рөлдердің қазақша атаулары */
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Әкімші",
  director: "Директор",
  vice_principal: "Директордың орынбасары",
  teacher: "Мұғалім",
  staff: "Қызметкер",
};

/** Директор өз мектебінде бере алатын рөлдер (директордан төмен) */
export const STAFF_ROLES: Role[] = ["vice_principal", "teacher", "staff"];

/** Жоспарлаушы тордағы бағандардың реті (unassigned-сыз) */
export const GRID_COLUMN_ORDER: ColumnId[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "next_week",
];

/** Барлық бағандар (unassigned қоса) */
export const ALL_COLUMN_IDS: ColumnId[] = ["unassigned", ...GRID_COLUMN_ORDER];

/** Бағандардың қазақша атаулары */
export const COLUMN_TITLES: Record<ColumnId, string> = {
  unassigned: "Жылдық жоспардан келген тапсырмалар",
  monday: "Дүйсенбі",
  tuesday: "Сейсенбі",
  wednesday: "Сәрсенбі",
  thursday: "Бейсенбі",
  friday: "Жұма",
  next_week: "Келесі аптаға өткізу",
};

export const TASK_TYPES = ["major", "minor"] as const;
export const TASK_STATUSES = ["pending", "in_progress", "done"] as const;
