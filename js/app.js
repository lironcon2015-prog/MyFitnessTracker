/* חיווט האפליקציה: טוען חוברת, מצייר, מנווט, שומר התקדמות. */

import { createPitch } from './pitch.js';
import { migrateLegacy, isLearned, toggleLearned, learnedCount, resetBooklet } from './store.js';

const $ = id => document.getElementById(id);

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function boot() {
  const index = await getJSON('content/booklets.json');
  const wanted = new URLSearchParams(location.search).get('b');
  const entry = index.booklets.find(b => b.id === wanted) || index.booklets[0];
  if (!entry) throw new Error('אין חוברות בקובץ booklets.json');

  const [booklet, formations] = await Promise.all([
    getJSON(entry.file),
    getJSON('content/formations.json')
  ]);
  const formation = formations[booklet.formation];
  if (!formation) throw new Error('מערך לא מוכר: ' + booklet.formation);

  start(booklet, formation);
}

function start(booklet, formation) {
  const S = booklet.scenarios;
  const ids = S.map(s => s.id);
  migrateLegacy(booklet.id, ids);

  /* --- כותרת החוברת --- */
  document.title = booklet.title + ' — תשיעיות';
  $('eyebrow').textContent = booklet.eyebrow;
  $('mark-b').textContent = booklet.mark;
  $('mark-p').textContent = booklet.mark;
  $('b-title').textContent = booklet.title;
  $('b-lede').textContent = booklet.lede;
  $('f-label').textContent = booklet.formationNote.label;
  $('f-label').after(' ' + booklet.formationNote.text);
  $('lg-role').textContent = 'ה-' + booklet.role;
  $('d-title').textContent = booklet.drills.title;
  $('d-foot').textContent = booklet.drills.foot;

  const drills = $('drills');
  booklet.drills.items.forEach(d => {
    const row = document.createElement('div');
    row.className = 'drill';
    const n = document.createElement('div');
    n.className = 'n';
    n.textContent = d.n;
    const p = document.createElement('p');
    p.textContent = d.text;
    row.append(n, p);
    drills.appendChild(row);
  });

  /* --- מגרש --- */
  const pitch = createPitch($('pitch'), formation, booklet.role);

  /* --- פס התקדמות --- */
  const track = $('track');
  S.forEach(() => track.appendChild(document.createElement('i')));
  function paintTrack() {
    [...track.children].forEach((b, j) => {
      b.className = j === idx ? 'here' : (isLearned(booklet.id, ids[j]) ? 'on' : '');
    });
    $('count').textContent = `למדתי ${learnedCount(booklet.id)} מתוך ${S.length}`;
  }

  /* --- צ'יפים --- */
  const chips = $('chips');
  S.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.dataset.phase = s.phase;
    const dot = document.createElement('i');
    dot.className = 'dot';
    b.append(dot, document.createTextNode(s.chip));
    b.onclick = () => render(i);
    chips.appendChild(b);
  });

  /* --- ציור תרחיש --- */
  let idx = 0;
  function render(i) {
    idx = i;
    const s = S[i];
    pitch.render(s);

    $('p-phase').textContent = s.phase;
    $('p-title').textContent = s.title;
    $('p-sub').textContent = s.sub;
    const ul = $('p-does');
    ul.textContent = '';
    s.does.forEach(d => {
      const li = document.createElement('li');
      li.textContent = d;
      ul.appendChild(li);
    });
    $('p-mistake').textContent = s.mistake;
    $('p-cue').textContent = s.cue;

    const on = isLearned(booklet.id, s.id);
    $('learn').setAttribute('aria-pressed', on);
    $('learn-txt').textContent = on ? '✓ למדתי את זה' : 'סמן שלמדתי את זה';

    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    [...chips.children].forEach((c, j) => c.setAttribute('aria-selected', j === i));
    chips.children[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    paintTrack();
  }

  /* --- ניווט --- */
  const go = d => render((idx + d + S.length) % S.length);
  $('next').onclick = () => go(1);
  $('prev').onclick = () => go(-1);
  $('learn').onclick = () => { toggleLearned(booklet.id, ids[idx]); render(idx); };
  $('reset').onclick = () => { resetBooklet(booklet.id); render(idx); };
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(1);
    if (e.key === 'ArrowRight') go(-1);
  });

  /* החלקה: בממשק ימין-לשמאל, החלקה ימינה מקדמת לתרחיש הבא */
  const board = $('board');
  let sx = 0, sy = 0, tracking = false;
  board.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  board.addEventListener('touchend', e => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx > 0 ? 1 : -1);
  }, { passive: true });

  document.documentElement.classList.remove('loading');
  $('state').style.display = 'none';
  render(0);
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
if ('serviceWorker' in navigator)
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
