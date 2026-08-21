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

const TIMEOUT = 10000;

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
        image: (d.image && d.image.url) || (d.logo && d.logo.url) || null
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
        image: line(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/)
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
  const out = { full: null, title: null, image: thumbUrl(url), log: [] };
  const wantFull = needsResolve(url);

  for (const provider of PROVIDERS) {
    /* יש כבר כל מה שצריך — אין סיבה להעיר עוד שירות */
    if (out.image && (!wantFull || out.full) && out.title) break;
    try {
      const res = await fetch(provider.build(url), { signal: AbortSignal.timeout(TIMEOUT) });
      if (!res.ok) { out.log.push(provider.id + ': ' + res.status); continue; }
      const got = await provider.read(res);

      /* כתובת מתקבלת רק אם הנגן באמת יודע לפתוח אותה, אחרת החלפנו קישור
         תקין באחר שגם הוא לא ינוגן */
      if (!out.full && got.full) {
        const clean = normalizeUrl(unwrap(got.full));
        if (clean && embedUrl(clean)) out.full = clean;
      }
      if (!out.title && got.title) out.title = clean_title(got.title);
      if (!out.image && got.image) out.image = normalizeUrl(got.image);

      out.log.push(provider.id + ': ' +
        [out.full ? 'כתובת' : '', out.title ? 'שם' : '', out.image ? 'תמונה' : '']
          .filter(Boolean).join(' + ') || 'בלי כלום');
    } catch (e) {
      out.log.push(provider.id + ': ' + (e && e.name === 'TimeoutError' ? 'לא ענה בזמן' : 'לא נגיש'));
    }
  }
  return out;
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
    image: pick(['og:image', 'og:image:secure_url', 'twitter:image'])
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
   240 פיקסלים ואיכות 0.7 נותנים כ-12KB — קטן מספיק כדי שמאה סרטונים
   ייכנסו לאחסון, וגדול מספיק לרוחב הכרטיס. */

const POSTER_WIDTH = 240;
const POSTER_MAX = 60 * 1024;

export function cachePoster(src) {
  return new Promise(resolve => {
    if (!src || src.startsWith('data:')) { resolve(src || null); return; }
    const img = new Image();
    /* בלי crossOrigin הציור מלכלך את הבד ו-toDataURL נחסם. שרת שלא מרשה
       יפיל את הטעינה, ואז נשמרת הכתובת עצמה כמו שהיא. */
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const scale = Math.min(1, POSTER_WIDTH / img.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.7);
        resolve(data.length > POSTER_MAX ? src : data);
      } catch (e) {
        resolve(src);   /* בד מלוכלך — נשמרת הכתובת */
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
