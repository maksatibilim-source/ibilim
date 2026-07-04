// ============================================================================
//  Барлық қолданбаның негізгі TypeScript типтері
//  (Core domain types for the whole application)
// ============================================================================

/** Тапсырманың маңыздылық түрі — үлкен / кіші */
export type TaskType = "major" | "minor";

/** Тапсырманың орындалу күйі */
export type TaskStatus = "pending" | "in_progress" | "done";

/**
 * Тапсырма (Google Sheets-тен импортталған жазба).
 * Техникалық талапта көрсетілген атрибуттар:
 * id, title, type, original_week, assigned_to, status
 */
export interface Task {
  id: string;
  title: string;
  type: TaskType;
  /** Жылдық жоспардағы бастапқы апта нөмірі */
  original_week: number;
  /** Бекітілген қызметкердің id-і немесе бекітілмесе null */
  assigned_to: string | null;
  status: TaskStatus;
}

/** Мектеп қызметкері (директордың орынбасарлары, мұғалімдер) */
export interface Staff {
  id: string;
  name: string;
  role: string;
}

/** Тақтадағы бағандардың тұрақты идентификаторлары */
export type ColumnId =
  | "unassigned"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "next_week";

/** Бір баған (жоспарлаушы тордағы немесе жоғарғы контейнердегі) */
export interface Column {
  id: ColumnId;
  title: string;
  /** Осы бағандағы тапсырмалардың реттелген id тізімі */
  taskIds: string[];
}

/** Drag-and-drop тақтасының толық күйі */
export interface BoardState {
  tasks: Record<string, Task>;
  columns: Record<ColumnId, Column>;
  /** Жоспарлаушы тордағы бағандардың көрсетілу реті (unassigned-сыз) */
  columnOrder: ColumnId[];
}

/** Қолданушының көрінісі: директор немесе қарапайым қызметкер */
export type ViewRole = "principal" | "staff";

// ----------------------------------------------------------------------------
//  Клиент ↔ сервер API пішіндері
// ----------------------------------------------------------------------------

/** Серверден келетін тапсырма пішіні */
export interface ApiTask {
  id: string;
  title: string;
  type: string;
  status: string;
  assigned_to: string | null;
  original_week: number;
  columnId: string;
  orderIndex: number;
  weekKey: string;
}

/** Мектеп туралы қысқаша ақпарат */
export interface SchoolInfo {
  id: string;
  name: string;
  logo: string | null;
  sheetUrl: string | null;
  sheetRange: string | null;
  sheetYearStart: string | null;
}

/** Ағымдағы кірген қолданушы */
export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
  position: string;
  schoolId: string | null;
  school: SchoolInfo | null;
}

/** Мектеп қызметкері/пайдаланушысы (басқару тізімдері үшін) */
export interface ManagedUser {
  id: string;
  name: string;
  username: string;
  role: string;
  position: string;
  schoolId: string | null;
}

/** Admin көрінісіндегі мектеп (директоры мен санауыштарымен) */
export interface AdminSchool extends SchoolInfo {
  createdAt: string;
  users: { id: string; name: string; username: string }[];
  _count: { users: number; tasks: number };
}

/** Бір қызметкердің тапсырма статистикасы */
export interface StaffStat {
  id: string;
  name: string;
  position: string;
  role: string;
  total: number;
  done: number;
  in_progress: number;
  pending: number;
}

/** Командалық статистика жауабы (директор dashboard) */
export interface TeamStats {
  staff: StaffStat[];
  totals: {
    total: number;
    done: number;
    in_progress: number;
    pending: number;
    unassigned: number;
  };
}

// ----------------------------------------------------------------------------
//  Аккаунттар мен рөлдер
// ----------------------------------------------------------------------------

/** Қолданушы рөлі (директор аккаунт ашқанда осылардың бірін береді) */
export type UserRole = "director" | "vice_principal" | "teacher" | "staff";

/**
 * Жеке аккаунт (профиль).
 * Ескерту: бұл — демо. Құпия сөз localStorage-та ашық түрде сақталады,
 * нақты өнімде хэштеу мен серверлік аутентификация қажет.
 */
export interface Account {
  id: string;
  /** Аты-жөні */
  name: string;
  /** Лауазымы (мыс. "Оқу ісі жөніндегі орынбасар") */
  position: string;
  role: UserRole;
  /** Жүйеге кіру аты */
  username: string;
  /** Демо мақсаттағы құпия сөз */
  password: string;
}
