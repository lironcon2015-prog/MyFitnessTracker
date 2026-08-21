/* ספריית הסרטונים ששמורה על המכשיר.

   סרטון שראית באינסטגרם או ביוטיוב נשמר כאן כקישור, לא כקובץ — האפליקציה
   אינה מעלה וידאו לשום מקום, והצפייה עצמה נעשית מול הפלטפורמה המקורית.

   הכול יושב במסמך אחד ב-localStorage ולא בכמה מפתחות, כי השלב הבא הוא
   סנכרון בין הטלפון שלי לטלפון של הילד: מסמך אחד עם updatedAt הוא מה
   שמעלים ומורידים בשלמותו, בלי למזג מפתחות זה מול זה. לכל פריט יש גם at
   (מתי נוצר) ו-updatedAt משלו, כדי שמיזוג עתידי יוכל להכריע פריט מול פריט
   ולא רק מסמך מול מסמך. */

const KEY = 'k8:videos';
const DOC_VERSION = 1;

/* שלוש הכותרות שאיתן מתחילים. אפשר להוסיף, לשנות שם ולמחוק — ולכן הן
   נשמרות כרשומות עם מזהה, ולא כמחרוזות: שינוי שם לא מיתם את הסרטונים. */
const SEED = ['אימוני טכניקה', 'אימוני טקטיקה', 'אימוני כושר'];

const now = () => Date.now();
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 7);

function readDoc() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const doc = JSON.parse(raw);
      if (doc && Array.isArray(doc.categories) && Array.isArray(doc.videos)) return doc;
    }
  } catch (e) { /* מצב פרטי או מסמך פגום — מתחילים מחדש */ }
  return {
    v: DOC_VERSION,
    updatedAt: now(),
    categories: SEED.map(name => ({ id: uid(), name, at: now(), updatedAt: now() })),
    videos: []
  };
}

let doc = readDoc();

function save() {
  doc.updatedAt = now();
  try {
    localStorage.setItem(KEY, JSON.stringify(doc));
  } catch (e) { /* אחסון מלא — ממשיכים בלי לשמור */ }
  return doc;
}

/** המסמך כולו — נקודת החיבור לסנכרון בשלב הבא */
export function exportDoc() {
  return JSON.parse(JSON.stringify(doc));
}

/* --- קטגוריות --- */

export function listCategories() {
  return doc.categories.slice();
}

export function categoryName(id) {
  const c = doc.categories.find(x => x.id === id);
  return c ? c.name : '';
}

/** מחזירה את הקטגוריה — קיימת או חדשה. שם שכבר קיים אינו נוצר פעמיים. */
export function addCategory(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const same = doc.categories.find(c => c.name === clean);
  if (same) return same;
  const cat = { id: uid(), name: clean, at: now(), updatedAt: now() };
  doc.categories.push(cat);
  save();
  return cat;
}

export function renameCategory(id, name) {
  const clean = String(name || '').trim();
  const cat = doc.categories.find(c => c.id === id);
  if (!cat || !clean) return false;
  cat.name = clean;
  cat.updatedAt = now();
  save();
  return true;
}

/** מחיקת כותרת אינה מוחקת סרטונים — הם עוברים ל"בלי כותרת" */
export function removeCategory(id) {
  const before = doc.categories.length;
  doc.categories = doc.categories.filter(c => c.id !== id);
  if (doc.categories.length === before) return false;
  doc.videos.forEach(v => {
    if (v.category === id) { v.category = null; v.updatedAt = now(); }
  });
  save();
  return true;
}

export function countByCategory() {
  const counts = {};
  doc.videos.forEach(v => {
    const k = v.category || '';
    counts[k] = (counts[k] || 0) + 1;
  });
  return counts;
}

/* --- סרטונים --- */

/** החדש למעלה: מה שהוספת עכשיו הוא מה שאתה מחפש */
export function listVideos(categoryId) {
  const all = doc.videos.slice().sort((a, b) => b.at - a.at);
  if (categoryId === undefined || categoryId === null) return all;
  if (categoryId === '') return all.filter(v => !v.category);
  return all.filter(v => v.category === categoryId);
}

export function getVideo(id) {
  return doc.videos.find(v => v.id === id) || null;
}

/** null אם הקישור אינו כתובת http/https תקינה */
export function addVideo({ url, title, note, category }) {
  const clean = normalizeUrl(url);
  if (!clean) return null;
  const video = {
    id: uid(),
    url: clean,
    platform: detectPlatform(clean).id,
    title: String(title || '').trim() || defaultTitle(clean),
    note: String(note || '').trim(),
    category: category || null,
    at: now(),
    updatedAt: now()
  };
  doc.videos.unshift(video);
  save();
  return video;
}

export function updateVideo(id, patch) {
  const video = doc.videos.find(v => v.id === id);
  if (!video) return null;
  if (patch.url !== undefined) {
    const clean = normalizeUrl(patch.url);
    if (!clean) return null;
    video.url = clean;
    video.platform = detectPlatform(clean).id;
  }
  if (patch.title !== undefined) video.title = String(patch.title).trim() || defaultTitle(video.url);
  if (patch.note !== undefined) video.note = String(patch.note).trim();
  if (patch.category !== undefined) video.category = patch.category || null;
  video.updatedAt = now();
  save();
  return video;
}

export function removeVideo(id) {
  const before = doc.videos.length;
  doc.videos = doc.videos.filter(v => v.id !== id);
  if (doc.videos.length === before) return false;
  save();
  return true;
}

export function videoCount() {
  return doc.videos.length;
}

/* --- הקישור עצמו --- */

/* קישור שמועתק מאפליקציה מגיע לפעמים בלי http, ולפעמים עם זנב מעקב.
   מנקים את שניהם: בלי הסכימה new URL נופל, והזנב רק מאריך את הכתובת. */
const TRACKING = /^(utm_|fbclid$|igshid$|igsh$|si$|_r$|_t$|feature$)/;

export function normalizeUrl(raw) {
  let text = String(raw || '').trim();
  if (!text) return null;
  /* הדבקה מאפליקציה מביאה לפעמים משפט שלם עם הקישור בתוכו */
  const found = text.match(/https?:\/\/\S+/);
  if (found) text = found[0];
  else if (/^[\w-]+(\.[\w-]+)+\//.test(text)) text = 'https://' + text;
  let url;
  try { url = new URL(text); } catch (e) { return null; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  [...url.searchParams.keys()].forEach(k => { if (TRACKING.test(k)) url.searchParams.delete(k); });
  return url.toString();
}

const PLATFORMS = [
  { id: 'youtube',   name: 'יוטיוב',    hosts: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
  { id: 'instagram', name: 'אינסטגרם',  hosts: ['instagram.com'] },
  { id: 'facebook',  name: 'פייסבוק',   hosts: ['facebook.com', 'fb.watch', 'fb.com'] },
  { id: 'tiktok',    name: 'טיקטוק',    hosts: ['tiktok.com'] },
  { id: 'x',         name: 'X',         hosts: ['x.com', 'twitter.com'] },
  { id: 'vimeo',     name: 'וימאו',     hosts: ['vimeo.com'] },
  { id: 'drive',     name: 'דרייב',     hosts: ['drive.google.com', 'photos.app.goo.gl', 'photos.google.com'] },
  { id: 'whatsapp',  name: 'וואטסאפ',   hosts: ['whatsapp.com'] }
];

const OTHER = { id: 'link', name: 'קישור' };

/** לפי הדומיין, עם התאמה גם לתת-דומיין (m.youtube.com, www.) */
export function detectPlatform(url) {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch (e) { return OTHER; }
  const hit = PLATFORMS.find(p => p.hosts.some(h => host === h || host.endsWith('.' + h)));
  return hit || OTHER;
}

export function platformName(id) {
  const hit = PLATFORMS.find(p => p.id === id);
  return hit ? hit.name : OTHER.name;
}

/** כשלא הוקלדה כותרת — משהו קריא מהכתובת, עדיף על שורה ריקה */
function defaultTitle(url) {
  const p = detectPlatform(url);
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean);
    const last = path[path.length - 1] || '';
    return last ? p.name + ' · ' + decodeURIComponent(last).slice(0, 40) : p.name;
  } catch (e) {
    return p.name;
  }
}

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/\/(shorts|embed|live|v)\/([^/?#]+)/);
    return m ? m[2] : null;
  } catch (e) { return null; }
}

/** תמונה מוקטנת בלי רשת נוספת — קיימת רק ליוטיוב, ולכן היא נופלת בשקט */
export function thumbUrl(url) {
  const id = detectPlatform(url).id === 'youtube' ? youtubeId(url) : null;
  return id ? 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg' : null;
}

/* נגינה בתוך הדף — רק בפלטפורמות שמאפשרות זאת בלי סקריפט שלהן.
   כשאין, נשארים עם "פתח" שמעביר לאפליקציה המקורית, ושם ממילא הצפייה
   נוחה יותר בטלפון. */
export function embedUrl(url) {
  const platform = detectPlatform(url).id;
  let u;
  try { u = new URL(url); } catch (e) { return null; }

  if (platform === 'youtube') {
    const id = youtubeId(url);
    return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0&playsinline=1' : null;
  }
  if (platform === 'instagram') {
    const m = u.pathname.match(/\/(p|reel|reels|tv)\/([^/?#]+)/);
    if (!m) return null;
    const kind = m[1] === 'reels' ? 'reel' : m[1];
    return 'https://www.instagram.com/' + kind + '/' + encodeURIComponent(m[2]) + '/embed';
  }
  if (platform === 'facebook') {
    /* התוסף של פייסבוק פותח רק כתובת מלאה של סרטון. קישור מקוצר —
       fb.watch או facebook.com/share/... — הוא הפניה, והתוסף אינו הולך
       אחריה: הוא מחזיר "Video unavailable" גם כשהסרטון עצמו תקין.
       ולכן במקרים האלה עדיף בלי כפתור ניגון מאשר עם מסך שחור. */
    if (u.hostname.endsWith('fb.watch')) return null;
    if (/^\/share\//.test(u.pathname)) return null;
    const known = /\/videos\/\d+/.test(u.pathname)
      || /\/reel\/\d+/.test(u.pathname)
      || /\/posts\//.test(u.pathname)
      || u.pathname.startsWith('/watch')
      || u.pathname.startsWith('/video.php');
    if (!known) return null;
    return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=false';
  }
  if (platform === 'tiktok') {
    const m = u.pathname.match(/\/video\/(\d+)/);
    return m ? 'https://www.tiktok.com/embed/v2/' + m[1] : null;
  }
  return null;
}

/* למה אין כפתור "נגן כאן". מוחזר רק כשהפלטפורמה בעצם יודעת לשבץ, אבל
   הקישור המסוים הזה לא — כדי שההסבר יופיע בדיוק במקום שבו הכפתור חסר. */
export function embedBlocked(url) {
  if (embedUrl(url)) return null;
  const platform = detectPlatform(url).id;
  let u;
  try { u = new URL(url); } catch (e) { return null; }

  if (platform === 'facebook') {
    if (u.hostname.endsWith('fb.watch') || /^\/share\//.test(u.pathname)) {
      return 'קישור מקוצר של פייסבוק לא מתנגן בתוך הדף. פתח אותו, ואם תרצה ניגון כאן — העתק מהדפדפן את הכתובת המלאה של הסרטון.';
    }
    return 'פייסבוק מנגנת בתוך הדף רק סרטונים ציבוריים עם כתובת מלאה.';
  }
  if (platform === 'tiktok') return 'קישור מקוצר של טיקטוק לא מתנגן בתוך הדף.';
  if (platform === 'instagram') return 'אינסטגרם מנגנת בתוך הדף רק פוסטים ורילסים ציבוריים.';
  return null;
}

/* רילסים וטיקטוק הם לאורך — מסגרת רחבה הייתה משאירה שתי רצועות שחורות */
export function isPortrait(url) {
  const platform = detectPlatform(url).id;
  if (platform === 'tiktok') return true;
  try {
    const path = new URL(url).pathname;
    if (platform === 'instagram') return /\/(reel|reels)\//.test(path);
    if (platform === 'facebook') return /\/reel\//.test(path);
  } catch (e) { /* כתובת פגומה — מסגרת רגילה */ }
  return false;
}
