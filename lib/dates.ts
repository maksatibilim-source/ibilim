// ============================================================================
//  Күн мен аптаны есептеуге арналған көмекші функциялар
//  (Date & week helpers)
// ============================================================================

/** Берілген күннің аптасының дүйсенбісін қайтарады (ISO апта басы) */
export function getMonday(input: Date): Date {
  const date = new Date(input);
  const day = date.getDay(); // 0 = жексенбі ... 6 = сенбі
  const diff = (day === 0 ? -6 : 1) - day; // дүйсенбіге жылжыту
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Күнге n күн қосу (теріс болса — азайту) */
export function addDays(input: Date, n: number): Date {
  const date = new Date(input);
  date.setDate(date.getDate() + n);
  return date;
}

/** Екі саннан тұратын формат (7 -> "07") */
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Күнді "04.07.2026" форматында жазу */
export function formatDate(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** Аптаны сақтауға арналған кілт: дүйсенбінің "2026-07-04" түрі */
export function weekKey(monday: Date): string {
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(
    monday.getDate()
  )}`;
}

/** Кілттен ("2026-07-04") қайтадан Date жасау */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Бүгінгі күнді қамтитын аптаның кілті */
export function getCurrentWeekKey(): string {
  return weekKey(getMonday(new Date()));
}
