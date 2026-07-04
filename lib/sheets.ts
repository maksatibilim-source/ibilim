// ============================================================================
//  Google Sheets импорты (жалпыға ашық сілтеме → CSV экспорты)
//  API кілті қажет емес: парақ "сілтемесі барлар көре алады" болуы керек.
//
//  Жылдық жоспардың құрылымы:
//    • Әр ЖОЛ — бір апта (диапазонның 1-жолы = 1-апта, 2-жолы = 2-апта, ...).
//    • Аптаның тапсырмалары КӨЛДЕНЕҢІНЕН орналасады (D, E, F, ... бағандары).
//    • Диапазон D бағанынан, апта жолдарынан басталуы керек (мыс. "D2:P53").
//    • Апта нөмірі оқу жылының басынан (1-апта дүйсенбісі) нақты күнге айналады.
// ============================================================================

import { addDays, keyToDate, weekKey } from "./dates";

/** Импортталатын бір тапсырма (аптасымен) */
export interface AnnualPlanItem {
  title: string;
  weekNumber: number;
  weekKey: string;
}

/** Google Sheets сілтемесінен spreadsheet id мен gid бөліп алу */
export function parseSheetUrl(url: string): { id: string; gid: string } | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  return { id: idMatch[1], gid: gidMatch ? gidMatch[1] : "0" };
}

/** CSV экспорт URL-ын құрастыру (gviz range-ды құрметтейді) */
export function buildCsvUrl(id: string, gid: string, range?: string | null): string {
  const params = new URLSearchParams({ tqx: "out:csv", gid });
  if (range && range.trim()) params.set("range", range.trim());
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${params.toString()}`;
}

/**
 * CSV мәтінін жолдар мен ұяшықтарға жіктеу.
 * Тырнақшадағы үтірлер мен қос тырнақшаны ("") дұрыс өңдейді.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // \r\n немесе жалғыз \r — елемейміз
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * CSV-ды жылдық жоспарға айналдыру.
 * Диапазонның әр жолы — кезекті апта (1-жол = 1-апта).
 * yearStartKey — оқу жылының 1-аптасының дүйсенбісі ("2026-08-03").
 */
export function parseAnnualPlan(
  csvText: string,
  yearStartKey: string
): AnnualPlanItem[] {
  const rows = parseCsv(csvText);
  const start = keyToDate(yearStartKey);
  const items: AnnualPlanItem[] = [];

  rows.forEach((cells, rowIndex) => {
    const weekNumber = rowIndex + 1; // диапазон 1-апта жолынан басталады
    const monday = addDays(start, (weekNumber - 1) * 7);
    const wk = weekKey(monday);

    for (const cell of cells) {
      const title = cell.trim();
      if (title) items.push({ title, weekNumber, weekKey: wk });
    }
  });

  return items;
}

/**
 * Мектептің Sheets сілтемесінен жылдық жоспарды жүктеу.
 * Қате болса — қазақша сипаттамасы бар Error лақтырады.
 */
export async function fetchAnnualPlan(
  sheetUrl: string,
  range: string | null | undefined,
  yearStartKey: string
): Promise<AnnualPlanItem[]> {
  const parsed = parseSheetUrl(sheetUrl);
  if (!parsed) throw new Error("Google Sheets сілтемесі жарамсыз.");

  const csvUrl = buildCsvUrl(parsed.id, parsed.gid, range);

  let res: Response;
  try {
    res = await fetch(csvUrl, { cache: "no-store" });
  } catch {
    throw new Error("Google Sheets-ке қосыла алмадық. Интернетті тексеріңіз.");
  }

  if (!res.ok) {
    throw new Error(
      "Парақты оқу мүмкін болмады. Сілтеме 'барлар көре алады' режимінде ашық екенін тексеріңіз."
    );
  }

  const text = await res.text();
  const head = text.trimStart().toLowerCase();
  if (head.startsWith("<!doctype") || head.startsWith("<html")) {
    throw new Error(
      "Парақ ашық емес сияқты. Google Sheets-ті 'сілтемесі барлар көре алады' етіп ашыңыз."
    );
  }

  return parseAnnualPlan(text, yearStartKey);
}
