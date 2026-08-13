/* מסך חוברת: מגרש, צ'יפים, פאנל ההסבר, ניווט בין תרחישים. */

import { buildPitch, createPitch } from './pitch.js';
import { isLearned, toggleLearned, learnedCount, resetBooklet, setLast } from './store.js';

const $ = id => document.getElementById(id);

/**
 * @param {object} booklet   החוברת מ-content/
 * @param {object} formation מיקומי ברירת מחדל
 * @param {string|null} startId  מזהה התרחיש לפתיחה
 * @param {(id:string)=>void} onScenario  נקרא בכל מעבר תרחיש, לעדכון הכתובת
 * @returns {{go:Function, destroy:Function}}
 */
export function mountBooklet(booklet, formation, startId, onScenario) {
  const S = booklet.scenarios;
  const ids = S.map(s => s.id);
  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push([target, type, fn, opts]);
  };

  /* תרחיש בודד שהגיע בקישור שיתוף: בלי התקדמות, מערך ותרגילים */
  const solo = !!booklet.solo;
  ['track', 'count', 'learn', 'formation', 'closing'].forEach(id => { $(id).hidden = solo; });

  /* --- כותרת החוברת --- */
  document.title = booklet.title + ' — תשיעיות';
  $('eyebrow').textContent = booklet.eyebrow;
  $('mark-b').textContent = booklet.mark;
  $('mark-p').textContent = booklet.mark;
  $('b-title').textContent = booklet.title;
  $('b-lede').textContent = booklet.lede;
  $('lg-role').textContent = 'ה-' + booklet.role;

  let formationText = null;
  if (!solo) {
    $('f-label').textContent = booklet.formationNote.label;
    /* צומת טקסט חשוף ולא span — כדי שגלישת השורות תהיה זהה לגרסה המקורית */
    formationText = document.createTextNode(' ' + booklet.formationNote.text);
    $('f-label').after(formationText);
    $('d-title').textContent = booklet.drills.title;
    $('d-foot').textContent = booklet.drills.foot;
  }

  const drills = $('drills');
  drills.textContent = '';
  (solo ? [] : booklet.drills.items).forEach(d => {
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
  const board = $('board');
  const svg = buildPitch();
  svg.id = 'pitch';
  board.prepend(svg);
  const pitch = createPitch(svg, formation, booklet.role);

  /* --- ניווט בין תרחישים (מוסתר כשיש רק אחד) --- */
  $('chips').parentElement.hidden = solo;   /* .rail */
  $('prev').parentElement.hidden = solo;    /* .nav */
  $('hint').hidden = solo;

  /* --- פס התקדמות --- */
  const track = $('track');
  track.textContent = '';
  S.forEach(() => track.appendChild(document.createElement('i')));
  function paintTrack() {
    [...track.children].forEach((b, j) => {
      b.className = j === idx ? 'here' : (isLearned(booklet.id, ids[j]) ? 'on' : '');
    });
    $('count').textContent = `למדתי ${learnedCount(booklet.id)} מתוך ${S.length}`;
  }

  /* --- צ'יפים --- */
  const chips = $('chips');
  chips.textContent = '';
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

    const learned = isLearned(booklet.id, s.id);
    $('learn').setAttribute('aria-pressed', learned);
    $('learn-txt').textContent = learned ? '✓ למדתי את זה' : 'סמן שלמדתי את זה';

    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    [...chips.children].forEach((c, j) => c.setAttribute('aria-selected', j === i));
    chips.children[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    paintTrack();

    setLast(booklet.id, s.id);
    if (onScenario) onScenario(s.id);
  }

  /* --- ניווט --- */
  const go = d => render((idx + d + S.length) % S.length);
  on($('next'), 'click', () => go(1));
  on($('prev'), 'click', () => go(-1));
  on($('learn'), 'click', () => { toggleLearned(booklet.id, ids[idx]); render(idx); });
  on($('reset'), 'click', () => { resetBooklet(booklet.id); render(idx); });

  /* החלקה: בממשק ימין-לשמאל, החלקה ימינה מקדמת לתרחיש הבא */
  let sx = 0, sy = 0, tracking = false;
  on(board, 'touchstart', e => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  on(board, 'touchend', e => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx > 0 ? 1 : -1);
  }, { passive: true });

  const first = Math.max(0, ids.indexOf(startId));
  render(first);

  return {
    go,
    destroy() {
      listeners.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
      svg.remove();
      if (formationText) formationText.remove();
    }
  };
}
