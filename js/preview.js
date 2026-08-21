/* תצוגה מקדימה של קישור: הכתובת המלאה, שם הסרטון והתמונה שלו.

   זה מה שוואטסאפ מציג כשמדביקים בו קישור, והוא מגיע מאותו מקום: תגיות
   og:title ו-og:image בדף של הסרטון. דף אינו יכול לקרוא דף מדומיין אחר
   (CORS), ולכן צריך שירות שמושך אותו במקומנו ומחזיר את מה שמצא. אותו
   שירות פותר גם קישור מקוצר — fb.watch ו-facebook.com/share הם הפניות,
   והנגן המשובץ של פייסבוק אינו הולך אחריהן.

   ארבעה ספקים ולא אחד, כי כל אחד מהם נופל לפעמים ולכל אחד יש עיוורון
   אחר: microlink מחזיר הכול מוכן אבל מוגבל בכמות, r.jina.ai מחזיר כתובת
   סופית וכותרת אבל לא תמונה, ושני האחרונים מחזירים HDML גולמי שממנו
   שולפים בעצמנו. מה שספק אחד לא ידע, הבא מנסה להשלים. */

import { normalizeUrl, embedUrl, detectPlatform, thumbUrl } from './videos.js';

const TIMEOUT = 8000;
/* תקרה לכל החיפוש. בלי זה, ארבעה ספקים תקועים היו מחזיקים את כפתור
   השמירה ארבעים שניות — והמשתמש מחכה מול הטלפון כל הזמן הזה. */
const BUDGET = 15000;

/* AbortSignal.timeout קיים רק מ-Safari 16, ובאייפון ישן יותר הוא זורק
   מיד — כלומר כל הספקים נכשלים בבת אחת עוד לפני שיצאה בקשה אחת.
   AbortController קיים מאז ומתמיד, ולכן הפסק הזמן נבנה ידנית. */
function withTimeout(url) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, TIMEOUT);
  const options = ctrl ? { signal: ctrl.signal } : {};
  return fetch(url, options).finally(() => clearTimeout(timer));
}

const PROVIDERS = [
  {
    id: 'microlink',
    build: u => 'https://api.microlink.io/?url=' + encodeURIComponent(u),
    read: async res => {
      const json = await res.json();
      const d = (json && json.data) || {};
      return {
        full: d.url || null,
        title: d.title || null,
        image: (d.image && d.image.url) || (d.logo && d.logo.url) || null,
        /* הקובץ עצמו. זה מה שמאפשר לנגן בלי הנגן של פייסבוק. */
        media: (d.video && d.video.url) || null
      };
    }
  },
  {
    id: 'jina',
    build: u => 'https://r.jina.ai/' + u,
    read: async res => {
      const text = await res.text();
      const line = re => { const m = text.match(re); return m ? m[1].trim() : null; };
      return {
        /* הכותרת של הקורא היא השורה הראשונה, והכתובת הסופית מגיעה אחריה */
        full: line(/^URL Source:\s*(\S+)/m),
        title: line(/^Title:\s*(.+)$/m),
        image: line(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/),
        media: line(/(https?:\/\/[^\s")]+\.mp4[^\s")]*)/)
      };
    }
  },
  {
    id: 'allorigins',
    build: u => 'https://api.allorigins.win/get?url=' + encodeURIComponent(u),
    read: async res => {
      const json = await res.json();
      const html = (json && json.contents) || '';
      return Object.assign(fromHtml(html), {
        full: (json && json.status && json.status.url) || fromHtml(html).full
      });
    }
  },
  {
    id: 'codetabs',
    build: u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
    read: async res => fromHtml(await res.text())
  }
];

/** האם צריך לפנות החוצה בשביל הכתובת עצמה (ולא רק בשביל תמונה) */
export function needsResolve(url) {
  const platform = detectPlatform(url).id;
  if (!['facebook', 'instagram', 'tiktok'].includes(platform)) return false;
  return !embedUrl(url);
}

/** מה שידוע על הקישור. השדות שלא נמצאו חוזרים null, והשאר עדיין שימושי. */
export async function lookup(url) {
  const out = { full: null, title: null, image: thumbUrl(url), media: null, log: [] };
  /* מתי אפשר להפסיק: יש שם, יש תמונה, ויש **דרך אחת** לנגן — הקובץ
     עצמו, או נגן משובץ שכבר עכשיו אפשר לבנות מהכתובת. קישור יוטיוב
     נסגר כך אחרי בקשה אחת: אין לו og:video, ואין שום טעם להעיר בגללו
     עוד שלושה שירותים ולהמתין להם. */
  const playable = () => out.media || embedUrl(url) || (out.full && embedUrl(out.full));
  const enough = () => out.title && out.image && playable();

  /* הספק הראשון לבדו, כי בדרך כלל הוא מספיק — ואז יצאה בקשה אחת בלבד.
     רק אם הוא לא סגר את העניין, נשלחים השאר, וביחד ולא בזה אחר זה:
     בטור, שני ספקים תקועים אכלו שש-עשרה שניות לפני שהשלישי בכלל התחיל. */
  await visit(PROVIDERS[0], url, out);
  if (!enough()) {
    const rest = PROVIDERS.slice(1).map(p => visit(p, url, out));
    await Promise.race([
      Promise.all(rest),
      new Promise(resolve => setTimeout(() => { out.log.push('נגמר הזמן'); resolve(); }, BUDGET))
    ]);
  }
  return out;
}

/** רק הקובץ, לרענון לפני ניגון — כתובת של קובץ בפייסבוק פגה אחרי שעות */
export async function refreshMedia(url) {
  const found = await lookup(url);
  return { media: found.media, full: found.full, log: found.log };
}

async function visit(provider, url, out) {
  try {
    const res = await withTimeout(provider.build(url));
    if (!res.ok) { out.log.push(provider.id + ': ' + res.status); return; }
    const got = await provider.read(res);

    /* כתובת מתקבלת רק אם הנגן באמת יודע לפתוח אותה, אחרת החלפנו קישור
       תקין באחר שגם הוא לא ינוגן */
    if (!out.full && got.full) {
      const clean = normalizeUrl(unwrap(got.full));
      if (clean && embedUrl(clean)) out.full = clean;
    }
    if (!out.media && got.media) {
      const file = normalizeUrl(got.media);
      /* og:video אינו תמיד קובץ: ביוטיוב ובטיקטוק הוא דף נגן, וניסיון
         לנגן דף HTML בתגית video נכשל בוודאות. מתקבל רק מה שנראה כמו
         קובץ וידאו אמיתי — וזה בדיוק מה שפייסבוק ואינסטגרם נותנות. */
      if (file && isVideoFile(file)) out.media = file;
    }
    if (!out.title && got.title) out.title = clean_title(got.title);
    if (!out.image && got.image) out.image = normalizeUrl(got.image);

    out.log.push(provider.id + ': ' + ([
      out.media ? 'קובץ' : '', out.full ? 'כתובת' : '',
      out.title ? 'שם' : '', out.image ? 'תמונה' : ''
    ].filter(Boolean).join(' + ') || 'בלי כלום'));
  } catch (e) {
    out.log.push(provider.id + ': ' + reason(e));
  }
}

const VIDEO_FILE = /\.(mp4|m4v|webm|mov|m3u8|mpd)$/i;

function isVideoFile(url) {
  try { return VIDEO_FILE.test(new URL(url).pathname); } catch (e) { return false; }
}

/* נוסח השגיאה עצמו, ולא "לא נגיש" סתמי. כשארבעה ספקים נופלים באותה
   שנייה זו סיבה אחת משותפת ולא ארבע תקלות, וההבדל בין "Load failed"
   (הרשת או הדומיין חסומים) לבין שם של פונקציה חסרה הוא כל האבחנה. */
function reason(e) {
  if (!e) return 'נכשל';
  if (e.name === 'AbortError') return 'לא ענה בתוך ' + (TIMEOUT / 1000) + ' שניות';
  return ((e.name || 'שגיאה') + ': ' + (e.message || '')).trim().slice(0, 90);
}

/** בדיקה יזומה: מה כל ספק עונה על כתובת ידועה. לאבחון כשמשהו לא עובד. */
export async function probe() {
  const target = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const lines = [];
  for (const provider of PROVIDERS) {
    const started = Date.now();
    try {
      const res = await withTimeout(provider.build(target));
      const ms = Date.now() - started;
      lines.push(provider.id + ': ' + (res.ok ? 'עונה' : 'שגיאה ' + res.status) + ' (' + ms + 'ms)');
    } catch (e) {
      lines.push(provider.id + ': ' + reason(e));
    }
  }
  return lines;
}

/* --- שליפה מ-HTML גולמי --- */

function fromHtml(html) {
  if (typeof html !== 'string' || !html) return { full: null, title: null, image: null };
  const pick = keys => {
    for (const key of keys) {
      const a = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'));
      if (a) return decode(a[1]);
      const b = html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + key + '["\']', 'i'));
      if (b) return decode(b[1]);
    }
    return null;
  };
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  /* דף ביניים שכל תוכנו הפניה — הכתובת יושבת בו כטקסט */
  const loose = html.match(/(https:\/\/(?:www\.)?(?:facebook\.com\/(?:reel|watch|[^/"'\s]+\/videos)|tiktok\.com\/@[^/"'\s]+\/video|instagram\.com\/(?:p|reel|tv))\/[^"'\s\\<>]+)/i);
  return {
    full: pick(['og:url']) || (canonical && decode(canonical[1])) || (loose && decode(loose[1])) || null,
    title: pick(['og:title', 'twitter:title']),
    image: pick(['og:image', 'og:image:secure_url', 'twitter:image']),
    /* הקובץ עצמו, כפי שהדף מצהיר עליו */
    media: pick(['og:video:secure_url', 'og:video:url', 'og:video', 'twitter:player:stream'])
  };
}

function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"');
}

/* "וידאו | פייסבוק" ושאר הזנבות שהפלטפורמה מוסיפה לשם — לא שם של סרטון */
function clean_title(raw) {
  return String(raw)
    .replace(/\s*[|·–-]\s*(Facebook|Instagram|TikTok|YouTube|Watch)\s*$/i, '')
    .trim()
    .slice(0, 120);
}

/* פייסבוק עוטפת לפעמים את היעד בדף התחברות, והכתובת האמיתית יושבת
   בפרמטר next. בלי הפתיחה הזאת היינו מוותרים על תשובה שהיא בעצם תקינה. */
function unwrap(raw) {
  let url;
  try { url = new URL(raw); } catch (e) { return raw; }
  const inner = url.searchParams.get('next') || url.searchParams.get('u');
  if (!inner) return url.toString();
  try { return new URL(inner).toString(); } catch (e) { return url.toString(); }
}

/* --- שמירת התמונה על המכשיר ---
   כתובת תמונה של פייסבוק ואינסטגרם נושאת חתימה שפגה אחרי זמן מה, וכעבור
   שבוע התמונה הייתה נעלמת מהספרייה. לכן היא מוקטנת ונשמרת כתמונה עצמה.

   720 פיקסלים ולא פחות: הכרטיס תופס את כל רוחב המסך, ובטלפון עם צפיפות
   של שלושה פיקסלים למסך זה כאלף פיקסלים אמיתיים. תמונה של 240 נראית
   מרוחה בדיוק במקום שבו היא אמורה לספר מה הסרטון. כ-45KB לתמונה, ואם
   האחסון יתמלא save() מוותרת על הישנות. */

const POSTER_WIDTH = 720;
const POSTER_MAX = 150 * 1024;

export function cachePoster(src) {
  return new Promise(resolve => {
    if (!src || src.startsWith('data:')) { resolve(src || null); return; }

    /* שרת תמונות שאינו עונה אינו סיבה לתקוע את השמירה. אחרי פסק הזמן
       נשמרת הכתובת עצמה, והכרטיס ינסה לטעון אותה כשיוצג. */
    let settled = false;
    const finish = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
    const timer = setTimeout(() => finish(src), TIMEOUT);

    const img = new Image();
    /* בלי crossOrigin הציור מלכלך את הבד ו-toDataURL נחסם. שרת שלא מרשה
       יפיל את הטעינה, ואז נשמרת הכתובת עצמה כמו שהיא. */
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => finish(src);
    img.onload = async () => {
      /* onload אומר שהבייטים הגיעו, לא שהתמונה פוענחה. ציור לפני הפענוח
         מייצר בד ריק, ובד ריק שנשמר כ-JPEG יוצא **שחור** — בדיוק התמונה
         השחורה שהופיעה בכרטיסים. decode ממתין לפענוח בפועל. */
      if (img.decode) { try { await img.decode(); } catch (e) { /* נמשיך ונבדוק */ } }
      try {
        const scale = Math.min(1, POSTER_WIDTH / img.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        if (!canvas.width || !canvas.height) { finish(src); return; }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        /* ואם למרות הכול יצא בד ריק — עדיף הכתובת המקורית על תמונה
           שחורה שנשמרת לתמיד ומחליפה את התמונה האמיתית */
        if (blank(ctx, canvas)) { finish(src); return; }
        const data = canvas.toDataURL('image/jpeg', 0.72);
        finish(data.length > POSTER_MAX ? src : data);
      } catch (e) {
        finish(src);   /* בד מלוכלך — נשמרת הכתובת */
      }
    };
    img.src = src;
  });
}

/* דגימה של תשע נקודות. תמונה אמיתית של מגרש או של אולם כמעט לעולם אינה
   אחידה לגמרי, ובד שלא צויר עליו כלום הוא שקוף — כלומר אלפא אפס. */
function blank(ctx, canvas) {
  const xs = [0.1, 0.5, 0.9];
  let opaque = 0;
  let first = null;
  let varied = false;
  for (const x of xs) {
    for (const y of xs) {
      const px = ctx.getImageData(
        Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1).data;
      if (px[3] > 8) opaque++;
      const key = px[0] + ',' + px[1] + ',' + px[2];
      if (first === null) first = key;
      else if (key !== first) varied = true;
    }
  }
  return opaque === 0 || !varied;
}
