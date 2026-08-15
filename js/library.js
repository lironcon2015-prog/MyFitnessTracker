/* מסך הבית: כרטיס לכל חוברת, עם מגרש מוקטן, התקדמות וכניסה לאימון. */

import { thumbnail, mirrorScenario, mirrorRole, mirrorText } from './pitch.js';
import {
  isLearned, learnedCount, getLast, isMirrored, quizSummary,
  hasMyNumber, getMyNumber, setMyNumber, quizTouched
} from './store.js';

const $ = id => document.getElementById(id);

/* ---------- המספר של הילד ----------
   שאלה אחת בפתיחה הראשונה, ואחריה החוברת של התפקיד שלו עולה ראשונה
   ומסומנת. לילד בן 11 אין דבר שמעניין אותו יותר מ"זה התפקיד שלי". */

function renderMe(booklets, formations, repaint) {
  const box = $('me');
  box.hidden = false;
  box.textContent = '';
  /* אחרי שנבחר מספר זו רק שורה, ולא צריכה מסגרת של כרטיס */
  box.className = hasMyNumber() ? 'me set' : 'me';

  if (hasMyNumber()) {
    const n = getMyNumber();
    const line = document.createElement('p');
    line.className = 'me-line';
    line.textContent = n ? `אתה מספר ${n}.` : 'עוד לא בחרת מספר.';

    const change = document.createElement('button');
    change.type = 'button';
    change.className = 'me-change';
    change.textContent = n ? 'החלף' : 'בחר מספר';
    change.onclick = () => { setMyNumber(null); repaint(); };

    line.append(' ', change);
    box.appendChild(line);
    return;
  }

  const ask = document.createElement('p');
  ask.className = 'me-ask';
  ask.textContent = 'איזה מספר אתה?';
  box.appendChild(ask);

  const hint = document.createElement('p');
  hint.className = 'me-hint';
  hint.textContent = 'כדי שהחוברת של התפקיד שלך תהיה ראשונה';
  box.appendChild(hint);

  /* המספרים מגיעים מהמערכים עצמם, כדי שמערך חדש לא ידרוש רשימה בקוד */
  const nums = [...new Set(
    booklets.flatMap(b => (formations[b.formation] || { order: [] }).order)
  )].sort((a, b) => a - b);

  const row = document.createElement('div');
  row.className = 'me-nums';
  nums.forEach(n => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = n;
    b.onclick = () => { setMyNumber(n); repaint(); };
    row.appendChild(b);
  });
  box.appendChild(row);

  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'me-later';
  later.textContent = 'אחר כך';
  later.onclick = () => { setMyNumber(0); repaint(); };
  box.appendChild(later);
}

export function renderLibrary(home, booklets, formations, onOpen, onQuiz, onTrain, version) {
  $('lib-eyebrow').textContent = home.eyebrow;
  $('lib-title').textContent = home.title;
  $('lib-lede').textContent = home.lede;
  $('lib-foot').textContent = home.foot;
  document.title = home.title + ' — תשיעיות';

  /* חיווי גרסה — כדי לדעת במבט אם העדכון האחרון הגיע למכשיר */
  $('lib-ver').textContent = version ? 'גרסה ' + version : '';

  const repaint = () => renderLibrary(home, booklets, formations, onOpen, onQuiz, onTrain, version);
  renderMe(booklets, formations, repaint);

  const mirrored = isMirrored();
  const heroOf = b => {
    const f = formations[b.formation];
    return f && mirrored ? mirrorRole(f, b.role) : b.role;
  };

  /* החוברת של המספר שלו ראשונה. בשיקוף ההשוואה היא מול התפקיד המשוקף,
     כך שילד שמאלי שהוא מספר 2 מקבל את חוברת המגן שהופכת עבורו ל-2. */
  const me = getMyNumber();
  const ordered = booklets.slice().sort((a, b) =>
    (heroOf(b) === me ? 1 : 0) - (heroOf(a) === me ? 1 : 0));

  const cards = $('cards');
  cards.textContent = '';

  ordered.forEach(b => {
    const formation = formations[b.formation];
    if (!formation) return;

    /* הכרטיס אינו כפתור אלא מכיל כפתורים: כותרת שפותחת את החוברת וכפתורי
       אימון. כפתור בתוך כפתור אינו חוקי, וגם לא היה מאפשר שתי פעולות. */
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = b.id;

    /* בשיקוף, תפקיד אגף מוצג כתפקיד האגף השני — שם ומספר כאחד */
    const hero = heroOf(b);
    const flip = t => (mirrored ? mirrorText(t) : t);
    const title = mirrored && b.titleB ? b.titleB : flip(b.title);
    const isMine = me > 0 && hero === me;
    if (isMine) card.classList.add('mine');

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const first = mirrored ? mirrorScenario(b.scenarios[0], formation) : b.scenarios[0];
    thumb.appendChild(thumbnail(first, formation, hero));

    const body = document.createElement('div');
    body.className = 'body';

    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = 'מספר ' + hero;
    if (isMine) {
      const tag = document.createElement('span');
      tag.className = 'mytag';
      tag.textContent = 'החוברת שלך';
      role.appendChild(tag);
    }

    const lastId = getLast(b.id);
    const done = learnedCount(b.id);

    const h3 = document.createElement('h3');
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = title;
    open.onclick = () => onOpen(b.id, lastId);
    h3.appendChild(open);

    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = flip(b.lede);

    body.append(role, h3, desc);

    /* המשך מאיפה שהפסיק — רק אם באמת התחיל ולא סיים */
    if (lastId && done < b.scenarios.length) {
      const s = b.scenarios.find(x => x.id === lastId);
      if (s) {
        const resume = document.createElement('p');
        resume.className = 'resume';
        resume.textContent = 'המשך: ' + flip(s.title);
        body.appendChild(resume);
      }
    }

    const track = document.createElement('div');
    track.className = 'track';
    b.scenarios.forEach(s => {
      const i = document.createElement('i');
      if (isLearned(b.id, s.id)) i.className = 'on';
      track.appendChild(i);
    });

    const count = document.createElement('div');
    count.className = 'count';
    count.textContent = `למדתי ${done} מתוך ${b.scenarios.length}`;

    /* האימון הקצר הוא הפעולה הראשית: שלוש שאלות בערב אחרי אימון הן משהו
       שילד באמת חוזר אליו, בניגוד למבדק על חוברת שלמה. */
    const train = document.createElement('button');
    train.type = 'button';
    train.className = 'traingo';
    train.textContent = quizTouched(b.id)
      ? 'האימון של היום · 3 תרחישים'
      : 'התחל אימון · 3 תרחישים';
    train.onclick = e => { e.stopPropagation(); onTrain(b.id); };

    /* המבדק המלא נשאר, כמהלך של סוף חוברת ולא כברירת מחדל */
    const quiz = document.createElement('button');
    quiz.type = 'button';
    quiz.className = 'quizgo';
    const q = quizSummary(b.id);
    quiz.textContent = q.done
      ? `מבדק מלא · ${q.exact} מדויקים מתוך ${q.done}`
      : 'מבדק מלא על כל החוברת';
    /* מודגש רק כשסימן שלמד את הכול */
    quiz.classList.toggle('ready', done === b.scenarios.length);
    quiz.onclick = e => { e.stopPropagation(); onQuiz(b.id); };

    body.append(track, count, train, quiz);
    card.append(thumb, body);

    /* לחיצה בכל מקום בכרטיס פותחת את החוברת, חוץ מכפתורי האימון */
    card.onclick = e => { if (!e.target.closest('.traingo, .quizgo')) onOpen(b.id, lastId); };
    cards.appendChild(card);
  });
}
