/* טעינת התוכן, ניתוב בין המסכים, והתקנה כאפליקציה.
   כתובות: #/ ספרייה · #/b/<חוברת> · #/b/<חוברת>/<תרחיש> */

import { mountBooklet } from './booklet.js';
import { renderLibrary } from './library.js';
import { migrateLegacy } from './store.js';

const $ = id => document.getElementById(id);

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function parseHash() {
  /* הכתובת מגיעה מקודדת כשיש בה תווים לא-לטיניים, ולכן מפענחים לפני ההשוואה */
  const dec = x => { try { return decodeURIComponent(x); } catch (e) { return x; } };
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(dec);
  if (parts[0] === 'b' && parts[1]) return { view: 'booklet', id: parts[1], scenario: parts[2] || null };
  if (parts[0] === 'x' && parts[1]) return { view: 'shared', data: parts[1] };
  return { view: 'library' };
}

/* תרחיש בודד שנשלח בקישור מהעורך — מגיע מקודד בכתובת, בלי לפרסם כלום.
   נעטף בחוברת סינתטית כדי שמסך החוברת יוכל להציג אותו כמו כל תרחיש. */
function decodeShared(data) {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const { r, f, t, s } = JSON.parse(new TextDecoder().decode(bytes));
  return {
    id: 'shared', solo: true, role: r, formation: f, mark: String(r),
    eyebrow: 'תרחיש ששותף', title: s.title || t || 'תרחיש', lede: s.sub || '',
    scenarios: [s]
  };
}

async function boot() {
  const index = await getJSON('content/booklets.json');
  const formations = await getJSON('content/formations.json');
  const booklets = (await Promise.all(
    index.booklets.map(b => getJSON(b.file).catch(err => { console.error(err); return null; }))
  )).filter(Boolean);
  if (!booklets.length) throw new Error('לא נטענה אף חוברת');

  /* לגרסה שקדמה לחוברות הייתה חוברת אחת בלבד; legacyBooklet אומר לאיזו
     מהן שייכים הסימונים הישנים. חייב לרוץ לפני שהספרייה מציגה מונים. */
  const legacyTarget = booklets.find(b => b.id === index.legacyBooklet) || booklets[0];
  migrateLegacy(legacyTarget.id, legacyTarget.scenarios.map(s => s.id));

  /* אם מסיבה כלשהי הגיע קובץ אינדקס מגרסה ישנה, עדיף ספרייה עם טקסט חסר
     מאשר מסך ריק — הכרטיסים עצמם נקראים מקבצי החוברות */
  const home = index.home || { eyebrow: '', title: 'החוברות', lede: '', foot: '' };
  let current = null;   // מסך החוברת הפעיל

  function openBooklet(id, scenarioId) {
    location.hash = '#/b/' + id + (scenarioId ? '/' + scenarioId : '');
  }

  function show(route) {
    if (current) { current.destroy(); current = null; }

    let booklet = null;
    if (route.view === 'booklet') {
      booklet = booklets.find(b => b.id === route.id);
      if (!booklet) {
        location.replace('#/');   // חוברת לא מוכרת — חזרה לספרייה
        return;
      }
    } else if (route.view === 'shared') {
      try {
        booklet = decodeShared(route.data);
      } catch (err) {
        console.error(err);
        location.replace('#/');   // קישור פגום
        return;
      }
    }

    $('library').hidden = !!booklet;
    $('booklet').hidden = !booklet;

    if (booklet) {
      const onScenario = booklet.solo ? null : id => {
        /* החלפת תרחיש מעדכנת את הכתובת בלי להוסיף צעד להיסטוריה,
           כדי שכפתור "אחורה" יחזור לספרייה ולא יעבור תרחיש-תרחיש */
        const want = '#/b/' + booklet.id + '/' + id;
        if (location.hash !== want) history.replaceState(null, '', want);
      };
      current = mountBooklet(booklet, formations[booklet.formation], route.scenario, onScenario);
    } else {
      renderLibrary(home, booklets, formations, openBooklet, index.version);
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', () => show(parseHash()));

  /* ?b=<id> נתמך מהגרסה הקודמת. replaceState ולא location.replace,
     כדי לא לירות hashchange לפני שהמסך מוכן */
  const legacy = new URLSearchParams(location.search).get('b');
  if (legacy && !location.hash) history.replaceState(null, '', '#/b/' + legacy);

  document.documentElement.classList.remove('loading');
  $('state').style.display = 'none';
  show(parseHash());

  /* מקשי חצים — נרשם פעם אחת ומופנה למסך הפעיל */
  document.addEventListener('keydown', e => {
    if (!current) return;
    if (e.key === 'ArrowLeft') current.go(1);
    if (e.key === 'ArrowRight') current.go(-1);
  });
}

boot().catch(err => {
  console.error(err);
  $('state').textContent = 'לא הצלחנו לטעון את התרחישים. נסו לרענן את הדף.';
});

/* --- התקנה ואופליין --- */
let deferred = null;
const ib = $('install');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e;
  ib.style.display = 'block';
});
ib.onclick = async () => {
  if (!deferred) return;
  ib.style.display = 'none';
  deferred.prompt();
  deferred = null;
};
if ('serviceWorker' in navigator) {
  /* אם כבר היה service worker פעיל בפתיחה, וגרסה חדשה השתלטה תוך כדי —
     טוענים מחדש פעם אחת, כדי שעדכון שפורסם יופיע בלי שצריך לרענן ידנית */
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => reg.update())
      .catch(() => {});
  });
}
