/* פתיחת קישור מקוצר לכתובת המלאה.

   כשמעתיקים סרטון מאפליקציית פייסבוק מקבלים fb.watch/xyz או
   facebook.com/share/r/xyz — כתובת שהיא רק הפניה. הנגן המשובץ של פייסבוק
   אינו הולך אחרי הפניה, ולכן הוא מחזיר "Video unavailable" גם על סרטון
   ציבורי תקין. כדי ללכת אחריה צריך לקרוא את הכתובת הסופית, והדפדפן אינו
   מרשה לדף אחד לקרוא תשובה מדומיין אחר (CORS) — ולכן זה נעשה דרך שירות
   ציבורי שמושך את הדף ומחזיר לנו את מה שיצא.

   שלוש הבטחות שהקוד כאן שומר:
   · הקישור יוצא החוצה רק כשהוא באמת מקוצר. כתובת מלאה של יוטיוב או
     אינסטגרם נבדקת על המכשיר ואינה נשלחת לאף אחד.
   · כישלון אינו שובר כלום. שירות שנפל, מכשיר בלי רשת, תשובה מוזרה —
     הסרטון פשוט נשמר כמו קודם, עם "פתח" ובלי "נגן כאן".
   · התוצאה נשמרת פעם אחת ליד הסרטון, כך שהפנייה החוצה קורית פעם אחת
     בחיים של כל קישור ולא בכל פתיחה של הספרייה. */

import { normalizeUrl, embedUrl, detectPlatform } from './videos.js';

/* שניים, כדי שנפילה של אחד לא תבטל את התכונה. הראשון מחזיר גם את הכתובת
   הסופית אחרי ההפניות — וזו בדיוק התשובה שאנחנו מחפשים; השני מחזיר רק
   את גוף הדף, ומשם שולפים את הכתובת מתוך תגיות og. */
const PROXIES = [
  {
    id: 'allorigins',
    build: u => 'https://api.allorigins.win/get?url=' + encodeURIComponent(u),
    read: async res => {
      const data = await res.json();
      return { last: data && data.status && data.status.url, html: data && data.contents };
    }
  },
  {
    id: 'codetabs',
    build: u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
    read: async res => ({ last: null, html: await res.text() })
  }
];

const TIMEOUT = 9000;

/** האם בכלל שווה לפנות החוצה: פלטפורמה שיודעת לשבץ, וקישור שאינו משבץ */
export function needsResolve(url) {
  const platform = detectPlatform(url).id;
  if (!['facebook', 'instagram', 'tiktok'].includes(platform)) return false;
  return !embedUrl(url);
}

/** הכתובת המלאה, או null אם לא הצלחנו — ואז הכול נשאר כמו שהיה */
export async function resolveUrl(url) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy.build(url), { signal: AbortSignal.timeout(TIMEOUT) });
      if (!res.ok) continue;
      const { last, html } = await proxy.read(res);
      for (const candidate of candidates(last, html)) {
        const clean = normalizeUrl(candidate);
        /* מקבלים רק כתובת שהנגן באמת יודע לפתוח — אחרת החלפנו קישור
           תקין בקישור אחר שגם הוא לא ינוגן */
        if (clean && embedUrl(clean)) return clean;
      }
    } catch (e) { /* שירות שנפל או אין רשת — לשירות הבא */ }
  }
  return null;
}

/* --- שליפת הכתובת מתוך מה שחזר --- */

function candidates(last, html) {
  const found = [];
  const add = v => { if (v) found.push(unwrap(v)); };

  add(last);
  if (typeof html === 'string' && html) {
    /* og:url הוא מה שפייסבוק עצמה מצהירה שהיא הכתובת של הסרטון, וסדר
       התכונות בתגית משתנה — ולכן שתי הצורות */
    add(meta(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i));
    add(meta(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i));
    add(meta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i));
    /* דף ביניים שכל תוכנו הוא הפניה — הכתובת יושבת בו כטקסט */
    add(meta(html, /(https:\/\/(?:www\.)?facebook\.com\/(?:reel|watch|[^/"'\s]+\/videos)\/[^"'\s\\<>]+)/i));
    add(meta(html, /(https:\/\/(?:www\.)?tiktok\.com\/@[^/"'\s]+\/video\/\d+)/i));
    add(meta(html, /(https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^/"'\s\\<>]+)/i));
  }
  return [...new Set(found.filter(Boolean))];
}

function meta(html, re) {
  const m = html.match(re);
  return m ? decode(m[1]) : null;
}

/* &amp; בתוך תגית הוא התו &, ובלי הפענוח הפרמטרים בכתובת נשברים */
function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"');
}

/* פייסבוק עוטפת לפעמים את היעד בדף התחברות או בדף יציאה, והכתובת
   האמיתית יושבת בפרמטר. בלי הפתיחה הזאת היינו מקבלים את דף ההתחברות
   כתשובה ומוותרים, למרות שהיעד עצמו כתוב בתוכו. */
function unwrap(raw) {
  let url;
  try { url = new URL(raw); } catch (e) { return raw; }
  const inner = url.searchParams.get('next') || url.searchParams.get('u');
  if (!inner) return url.toString();
  try { return new URL(inner).toString(); } catch (e) { return url.toString(); }
}
