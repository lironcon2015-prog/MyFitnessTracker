/* מבדק: מציג את המגרש ברגע שלפני הפעולה, והילד ממקם את עצמו.

   השאלות נגזרות מהתרחישים הקיימים ולא נכתבות בנפרד: חץ הריצה של השחקן
   הוא בדיוק "מאיפה לאן" — תחילתו היא המצב שלפני, וסופו התשובה. תרחיש בלי
   ריצה כזאת (מפת תפקיד) נופל מהמבדק מעצמו. תרחיש שהוא החלטה ולא תנועה
   יכול לשאת שדה quiz משלו בקובץ החוברת. */

import { buildPitch, createPitch, el, svgPoint, PER_METER } from './pitch.js';
import { saveQuizResult } from './store.js';

const $ = id => document.getElementById(id);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const meters = u => u / PER_METER;

/* ספי דיוק במטרים. שלושה מטר זה בערך צעד וחצי של ילד בריצה */
const EXACT = 3, CLOSE = 6;
const MIN_RUN = 30;   /* פחות מזה איננו תנועה אלא החלטה */

/* ---------- בניית השאלות ---------- */

export function buildQuestions(booklet, formation) {
  const role = booklet.role;
  const cues = booklet.scenarios.map(s => s.cue).filter(Boolean);

  return booklet.scenarios.map(s => {
    if (s.quiz && s.quiz.type === 'choice') return choiceQuestion(s, booklet, formation, role);
    return moveQuestion(s, booklet, formation, role, cues);
  }).filter(Boolean);
}

function moveQuestion(s, booklet, formation, role, cues) {
  const to = (s.pos && s.pos[role]) || formation.base[role];
  const run = (s.arrows || []).find(a => a.k === 'run' && dist(a.b, to) <= 25);
  if (!run || dist(run.a, run.b) < MIN_RUN) return null;

  return {
    id: s.id, scenario: s, type: 'move',
    from: run.a, to,
    before: beforeState(s, role, run.a),
    context: context(s, formation, role),
    ask: 'לאן אתה זז עכשיו?',
    cue: s.cue,
    cueOptions: pickCues(s.cue, cues)
  };
}

function choiceQuestion(s, booklet, formation, role) {
  const q = s.quiz;
  const from = (s.pos && s.pos[role]) || formation.base[role];
  return {
    id: s.id, scenario: s, type: 'choice',
    from, to: from,
    before: beforeState(s, role, from),
    context: context(s, formation, role),
    ask: q.ask,
    options: q.options, answer: q.answer, why: q.why,
    cue: s.cue, cueOptions: null
  };
}

/** המגרש כפי שהוא נראה לפני הפעולה: בלי חיצים, נקודות התחלה, אזורים וצל */
function beforeState(s, role, from) {
  const b = { ...s, pos: { ...(s.pos || {}) } };
  b.pos[role] = from;
  delete b.arrows; delete b.ghosts; delete b.zones; delete b.shadow;
  return b;
}

/** שורת ההקשר נגזרת מהמגרש עצמו, כדי לא להסגיר את התשובה */
function context(s, formation, role) {
  const near = holder(s, formation);
  const who = !near ? 'הכדור חופשי'
    : near.us ? (near.num === role ? 'הכדור אצלך' : 'הכדור אצל מספר ' + near.num)
    : 'הכדור אצל היריב';
  return s.phase + ' · ' + who;
}

function holder(s, formation) {
  let best = null, bestD = 20;
  formation.order.forEach(n => {
    const p = (s.pos && s.pos[n]) || formation.base[n];
    const d = dist(p, s.ball);
    if (d < bestD) { bestD = d; best = { us: true, num: n }; }
  });
  (s.opp || []).forEach(o => {
    const d = dist(o, s.ball);
    if (d < bestD) { bestD = d; best = { us: false }; }
  });
  return best;
}

/** המשפט הנכון ועוד שניים מהחוברת, מעורבבים */
function pickCues(correct, all) {
  if (!correct) return null;
  const others = all.filter(c => c !== correct);
  const picked = [];
  while (picked.length < 2 && others.length) {
    picked.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
  }
  if (!picked.length) return null;
  return shuffle([correct, ...picked]);
}

function shuffle(a) {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ---------- המסך ---------- */

export function mountQuiz(booklet, formation, only, onExit) {
  let questions = shuffle(buildQuestions(booklet, formation));
  if (only && only.length) questions = questions.filter(q => only.includes(q.id));
  if (!questions.length) {
    $('q-ask').textContent = 'אין עדיין תרחישים למבדק בחוברת הזאת.';
    return { destroy() {} };
  }

  const listeners = [];
  const on = (t, type, fn, opts) => { t.addEventListener(type, fn, opts); listeners.push([t, type, fn, opts]); };

  const svg = buildPitch();
  svg.classList.add('quizing');
  $('q-board').prepend(svg);
  const pitch = createPitch(svg, formation, booklet.role);
  const overlay = el('g', { class: 'g-quiz' });
  svg.appendChild(overlay);

  $('q-eyebrow').textContent = 'מבדק · ' + booklet.title;

  const track = $('q-track');
  track.textContent = '';
  questions.forEach(() => track.appendChild(document.createElement('i')));

  let i = 0;             /* שאלה נוכחית */
  let guess = null;      /* המיקום שסימן */
  let tries = 0;
  let phase = 'ask';     /* ask · retry · reveal · cue · done */
  const results = [];

  function q() { return questions[i]; }

  /* --- ציור --- */

  function paint() {
    const cur = q();
    overlay.textContent = '';

    if (phase === 'reveal' || phase === 'cue') {
      pitch.render(cur.scenario, { animate: false });
      if (cur.type === 'move' && guess) {
        overlay.appendChild(el('circle', { cx: guess[0], cy: guess[1], r: 15, class: 'q-guess' }));
        const t = el('text', { x: guess[0], y: guess[1] + 30, class: 'q-tag' });
        t.textContent = 'סימנת';
        overlay.appendChild(t);
      }
    } else {
      const view = { ...cur.before, pos: { ...cur.before.pos } };
      if (guess) view.pos[booklet.role] = guess;
      pitch.render(view, { animate: false });
      /* מאיפה יצא — כדי שיראה את התנועה שהוא מציע */
      overlay.appendChild(el('circle', { cx: cur.from[0], cy: cur.from[1], r: 13, class: 'q-from' }));
    }

    [...track.children].forEach((b, j) => {
      b.className = j === i ? 'here' : (results[j] ? results[j].grade : '');
    });
    $('q-count').textContent = `שאלה ${i + 1} מתוך ${questions.length}`;
  }

  /* --- מיקום --- */

  let dragging = false;
  const place = e => {
    if (phase !== 'ask' && phase !== 'retry') return;
    if (q().type !== 'move') return;
    guess = svgPoint(svg, e);
    $('q-confirm').disabled = false;
    paint();
  };
  on(svg, 'pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); place(e); });
  on(svg, 'pointermove', e => { if (dragging) place(e); });
  on(svg, 'pointerup', () => { dragging = false; });
  on(svg, 'pointercancel', () => { dragging = false; });

  /* --- שלבי השאלה --- */

  function askPhase() {
    const cur = q();
    guess = null; tries = 0; phase = 'ask';
    $('q-context').textContent = cur.context;
    $('q-ask').textContent = cur.ask;
    $('q-feed').hidden = true;
    $('q-choices').hidden = cur.type !== 'choice';
    $('q-confirm').hidden = cur.type !== 'move';
    $('q-confirm').disabled = true;
    $('q-confirm').textContent = 'זהו, זה המקום';
    $('q-hint').hidden = cur.type !== 'move';
    $('q-confirm').onclick = confirm;
    if (cur.type === 'choice') renderChoices(cur.options, choose);
    paint();
  }

  function confirm() {
    const cur = q();
    tries++;
    const off = meters(dist(guess, cur.to));

    /* ניסיון שני לפני שרואים את התשובה — מכריח לחשוב פעמיים */
    if (off > CLOSE && tries === 1) {
      phase = 'retry';
      $('q-feed').hidden = false;
      $('q-feed').className = 'qfeed miss';
      $('q-feed').textContent = 'רחוק. תסתכל איפה הכדור ואיפה החלל — ונסה שוב.';
      return;
    }
    reveal(off);
  }

  function reveal(off) {
    const cur = q();
    const grade = off <= EXACT ? 'exact' : off <= CLOSE ? 'close' : 'far';
    results[i] = { id: cur.id, grade, meters: off, tries };
    saveQuizResult(booklet.id, cur.id, grade, off);

    phase = 'reveal';
    $('q-confirm').hidden = true;
    $('q-feed').hidden = false;
    $('q-feed').className = 'qfeed ' + grade;
    $('q-feed').textContent =
      grade === 'exact' ? (tries === 1 ? 'מדויק.' : 'מדויק, בניסיון השני.')
      : grade === 'close' ? `קרוב — ${off.toFixed(1)} מטר מהמקום.`
      : `${off.toFixed(1)} מטר מהמקום. תראה את החץ.`;
    $('q-hint').hidden = true;
    paint();
    cuePhase();
  }

  function choose(k) {
    const cur = q();
    const right = k === cur.answer;
    results[i] = { id: cur.id, grade: right ? 'exact' : 'far', meters: 0, tries: 1 };
    saveQuizResult(booklet.id, cur.id, right ? 'exact' : 'far', 0);
    phase = 'reveal';
    markChoices(cur.answer, k);
    $('q-feed').hidden = false;
    $('q-feed').className = 'qfeed ' + (right ? 'exact' : 'far');
    $('q-feed').textContent = (right ? 'נכון. ' : 'לא. ') + (cur.why || '');
    paint();
    next();
  }

  /* --- שאלת המשפט --- */

  function cuePhase() {
    const cur = q();
    if (!cur.cueOptions) return next();
    phase = 'cue';
    $('q-ask').textContent = 'ואיזה משפט מתאים לתרחיש הזה?';
    $('q-choices').hidden = false;
    renderChoices(cur.cueOptions, k => {
      const right = cur.cueOptions[k] === cur.cue;
      markChoices(cur.cueOptions.indexOf(cur.cue), k);
      if (results[i]) results[i].cue = right;
      $('q-feed').className = 'qfeed ' + (right ? 'exact' : 'far');
      $('q-feed').textContent = right ? 'זה המשפט.' : 'המשפט הנכון מסומן.';
      next();
    });
  }

  function renderChoices(options, cb) {
    const box = $('q-choices');
    box.textContent = '';
    options.forEach((text, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.textContent = text;
      b.onclick = () => cb(k);
      box.appendChild(b);
    });
  }

  function markChoices(correct, chosen) {
    [...$('q-choices').children].forEach((b, k) => {
      b.disabled = true;
      if (k === correct) b.classList.add('right');
      else if (k === chosen) b.classList.add('wrong');
    });
  }

  function next() {
    $('q-confirm').hidden = false;
    $('q-confirm').disabled = false;
    $('q-confirm').textContent = i + 1 < questions.length ? 'השאלה הבאה' : 'סיימתי';
    $('q-confirm').onclick = () => {
      if (i + 1 < questions.length) { i++; askPhase(); }
      else summary();
    };
  }

  /* --- סיכום --- */

  function summary() {
    phase = 'done';
    const exact = results.filter(r => r.grade === 'exact').length;
    const close = results.filter(r => r.grade === 'close').length;
    const far = results.filter(r => r.grade === 'far').length;
    const missed = results.filter(r => r.grade !== 'exact').map(r => r.id);

    $('q-stage').hidden = true;
    const box = $('q-result');
    box.hidden = false;
    box.textContent = '';

    const h = document.createElement('h2');
    h.textContent = exact === results.length ? 'הכול מדויק.' : 'סיימת את המבדק';
    box.appendChild(h);

    const line = document.createElement('p');
    line.className = 'q-tally';
    line.textContent = `${exact} מדויקים · ${close} קרובים · ${far} רחוקים`;
    box.appendChild(line);

    if (missed.length) {
      const t = document.createElement('p');
      t.className = 'sub';
      t.textContent = 'כדאי לחזור על:';
      box.appendChild(t);
      const ul = document.createElement('ul');
      missed.forEach(id => {
        const s = booklet.scenarios.find(x => x.id === id);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#/b/${booklet.id}/${id}`;
        a.textContent = s ? s.title : id;
        li.appendChild(a);
        ul.appendChild(li);
      });
      box.appendChild(ul);

      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'learn';
      again.textContent = 'רק את אלה שפספסתי';
      again.onclick = () => onExit(missed);
      box.appendChild(again);
    }

    const all = document.createElement('div');
    all.className = 'nav';
    const b1 = document.createElement('button');
    b1.type = 'button';
    b1.textContent = 'מבדק מלא מחדש';
    b1.onclick = () => onExit([]);
    const b2 = document.createElement('button');
    b2.type = 'button';
    b2.textContent = 'חזרה לחוברת';
    b2.onclick = () => { location.hash = '#/b/' + booklet.id; };
    all.append(b1, b2);
    box.appendChild(all);
  }

  $('q-stage').hidden = false;
  $('q-result').hidden = true;
  askPhase();

  return {
    destroy() {
      listeners.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
      svg.remove();
    }
  };
}
