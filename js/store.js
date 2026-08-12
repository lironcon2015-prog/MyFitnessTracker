/* התקדמות ששמורה על המכשיר.
   בגרסה הקודמת הסימונים נשמרו לפי מיקום התרחיש במערך, כך שכל הוספה או
   שינוי סדר היו מזיזים אותם לתרחישים אחרים. כאן הם נשמרים לפי מזהה קבוע. */

const KEY = 'k8:progress';        // { bookletId: [scenarioId, ...] }
const LEGACY_KEY = 'k8:learned';  // הפורמט הישן: מערך של אינדקסים
const ME_KEY = 'k8:me';           // מספר החולצה של הילד

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* מצב פרטי או אחסון מלא — ממשיכים בלי לשמור */ }
}

let progress = readJSON(KEY, {});

/** העברת הסימונים מהפורמט הישן, פעם אחת, לפי סדר התרחישים המקורי */
export function migrateLegacy(bookletId, scenarioIds) {
  const legacy = readJSON(LEGACY_KEY, null);
  if (!Array.isArray(legacy)) return false;
  if (!progress[bookletId]) {
    progress[bookletId] = legacy
      .map(i => scenarioIds[i])
      .filter(Boolean);
    writeJSON(KEY, progress);
  }
  try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* לא קריטי */ }
  return true;
}

export function isLearned(bookletId, scenarioId) {
  return (progress[bookletId] || []).includes(scenarioId);
}

export function toggleLearned(bookletId, scenarioId) {
  const list = progress[bookletId] || [];
  progress[bookletId] = list.includes(scenarioId)
    ? list.filter(x => x !== scenarioId)
    : list.concat(scenarioId);
  writeJSON(KEY, progress);
  return progress[bookletId].includes(scenarioId);
}

export function learnedCount(bookletId) {
  return (progress[bookletId] || []).length;
}

export function resetBooklet(bookletId) {
  delete progress[bookletId];
  writeJSON(KEY, progress);
}

/* --- התרחיש האחרון שנצפה בכל חוברת, כדי להמשיך מאיפה שהפסיק --- */
const LAST_KEY = 'k8:last';
let last = readJSON(LAST_KEY, {});

export function setLast(bookletId, scenarioId) {
  if (last[bookletId] === scenarioId) return;
  last[bookletId] = scenarioId;
  writeJSON(LAST_KEY, last);
}

export function getLast(bookletId) {
  return last[bookletId] || null;
}

/** מספר החולצה של הילד. משמש לסימון "החוברות שלי", לא לצביעת הדיאגרמות —
    את השחקן המודגש קובעת החוברת, כי התרחישים מתארים תפקיד מסוים. */
export function getMyNumber() {
  const v = parseInt(localStorage.getItem(ME_KEY) || '', 10);
  return Number.isFinite(v) ? v : 8;
}

export function setMyNumber(n) {
  try { localStorage.setItem(ME_KEY, String(n)); } catch (e) { /* לא קריטי */ }
}
