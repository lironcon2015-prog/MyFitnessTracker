/* מסך חוברת: מגרש, צ'יפים, פאנל ההסבר, ניווט בין תרחישים. */

import { buildPitch, createPitch, mirrorScenario, mirrorRole } from './pitch.js';
import { isLearned, toggleLearned, learnedCount, resetBooklet, setLast, isMirrored, setMirrored } from './store.js';

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
  ['track', 'count', 'learn', 'formation', 'closing', 'side'].forEach(id => { $(id).hidden = solo; });

  /* בשיקוף, תפקיד אגף הופך לתפקיד האגף השני: גם המספר המודגש וגם השם */
  const hero = () => (isMirrored() ? mirrorRole(formation, booklet.role) : booklet.role);
  const heroTitle = () => (isMirrored() && booklet.titleB ? booklet.titleB : booklet.title);

  /* --- כותרת החוברת --- */
  $('eyebrow').textContent = booklet.eyebrow;
  $('b-lede').textContent = booklet.lede;

  function paintHead() {
    const n = String(hero());
    document.title = heroTitle() + ' — תשיעיות';
    $('mark-b').textContent = n;
    $('mark-p').textContent = n;
    /* מספר דו-ספרתי לא נכנס בגודל של ספרה אחת */
    $('mark-b').parentElement.classList.toggle('wide', n.length > 1);
    $('b-title').textContent = heroTitle();
    $('lg-role').textContent = 'ה-' + n;
  }
  paintHead();

  let formationText = null;
  if (!solo) {
    $('f-label').textContent = booklet.formationNote.label;
    /* צומת טקסט חשוף ולא span — כדי שגלישת השורות תהיה זהה לגרסה המקורית */
    formationText = document.createTextNode(' ' + booklet.formationNote.text);
    $('f-label').after(formationText);
  }

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

  /* --- מתג הצד --- */
  const side = booklet.side || { label: 'הצד של ה-' + booklet.role + ':', a: 'ימין', b: 'שמאל' };
  const hintA = side.hintA || ('מותאם ל' + side.a), hintB = side.hintB || ('מותאם ל' + side.b);
  $('side-label').textContent = side.label;
  const sideBtns = [...$('side').querySelectorAll('button')];
  sideBtns[0].textContent = side.a;
  sideBtns[1].textContent = side.b;
  function paintSide() {
    const m = isMirrored();
    sideBtns.forEach(b => b.setAttribute('aria-pressed', (b.dataset.foot === 'L') === m));
    $('side-hint').textContent = m ? hintB : hintA;
  }
  sideBtns.forEach(b => on(b, 'click', () => {
    const want = b.dataset.foot === 'L';
    if (want === isMirrored()) return;
    setMirrored(want);
    paintSide();
    paintHead();
    render(idx);
  }));
  paintSide();

  /* --- ציור תרחיש --- */
  let idx = 0;
  function render(i) {
    idx = i;
    const s = S[i];
    pitch.setRole(hero());
    pitch.render(isMirrored() ? mirrorScenario(s, formation) : s);

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
