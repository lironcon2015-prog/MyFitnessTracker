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

/* --- תוצאות המבדק, לפי מזהה תרחיש כמו ההתקדמות --- */
const QUIZ_KEY = 'k8:quiz';
let quiz = readJSON(QUIZ_KEY, {});

export function saveQuizResult(bookletId, scenarioId, grade, offMeters) {
  const book = quiz[bookletId] || (quiz[bookletId] = {});
  const prev = book[scenarioId];
  const better = !prev || rank(grade) > rank(prev.grade);
  book[scenarioId] = {
    grade: better ? grade : prev.grade,
    meters: better ? +offMeters.toFixed(1) : prev.meters,
    last: grade,
    tries: (prev ? prev.tries : 0) + 1
  };
  writeJSON(QUIZ_KEY, quiz);
}

const rank = g => (g === 'exact' ? 2 : g === 'close' ? 1 : 0);

/** כמה תרחישים נענו במדויק בחוברת */
export function quizSummary(bookletId) {
  const book = quiz[bookletId] || {};
  const ids = Object.keys(book);
  return { done: ids.length, exact: ids.filter(k => book[k].grade === 'exact').length };
}

export function resetQuiz(bookletId) {
  delete quiz[bookletId];
  writeJSON(QUIZ_KEY, quiz);
}

/* --- הצד שבו משחקים: R כברירת מחדל, L משקף את כל התרחישים --- */
const SIDE_KEY = 'k8:side';

export function isMirrored() {
  try { return localStorage.getItem(SIDE_KEY) === 'L'; } catch (e) { return false; }
}

export function setMirrored(on) {
  try { localStorage.setItem(SIDE_KEY, on ? 'L' : 'R'); } catch (e) { /* לא קריטי */ }
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
