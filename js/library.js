/* מסך הבית: כרטיס לכל חוברת, עם מגרש מוקטן, התקדמות וכניסה למבדק. */

import { thumbnail, mirrorScenario, mirrorRole, mirrorText } from './pitch.js';
import { isLearned, learnedCount, getLast, isMirrored, quizSummary } from './store.js';

const $ = id => document.getElementById(id);

export function renderLibrary(home, booklets, formations, onOpen, onQuiz, version) {
  $('lib-eyebrow').textContent = home.eyebrow;
  $('lib-title').textContent = home.title;
  $('lib-lede').textContent = home.lede;
  $('lib-foot').textContent = home.foot;
  document.title = home.title + ' — תשיעיות';

  /* חיווי גרסה — כדי לדעת במבט אם העדכון האחרון הגיע למכשיר */
  $('lib-ver').textContent = version ? 'גרסה ' + version : '';

  const cards = $('cards');
  cards.textContent = '';

  booklets.forEach(b => {
    const formation = formations[b.formation];
    if (!formation) return;

    /* הכרטיס אינו כפתור אלא מכיל כפתורים: כותרת שפותחת את החוברת וכפתור
       מבדק. כפתור בתוך כפתור אינו חוקי, וגם לא היה מאפשר שתי פעולות. */
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = b.id;

    /* בשיקוף, תפקיד אגף מוצג כתפקיד האגף השני — שם ומספר כאחד */
    const mirrored = isMirrored();
    const hero = mirrored ? mirrorRole(formation, b.role) : b.role;
    const flip = t => (mirrored ? mirrorText(t) : t);
    const title = mirrored && b.titleB ? b.titleB : flip(b.title);

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const first = mirrored ? mirrorScenario(b.scenarios[0], formation) : b.scenarios[0];
    thumb.appendChild(thumbnail(first, formation, hero));

    const body = document.createElement('div');
    body.className = 'body';

    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = 'מספר ' + hero;

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

    /* המבדק יושב על החוברת שאליה הוא שייך, ולא בתחתית מסך אחר */
    const quiz = document.createElement('button');
    quiz.type = 'button';
    quiz.className = 'quizgo';
    const q = quizSummary(b.id);
    quiz.textContent = q.done
      ? `מבדק · ${q.exact} מדויקים מתוך ${q.done}`
      : 'מבדק — בלי הסברים, רק אתה והמגרש';
    /* מודגש רק כשסימן שלמד את הכול */
    quiz.classList.toggle('ready', done === b.scenarios.length);
    quiz.onclick = e => { e.stopPropagation(); onQuiz(b.id); };

    body.append(track, count, quiz);
    card.append(thumb, body);

    /* לחיצה בכל מקום בכרטיס פותחת את החוברת, חוץ מכפתור המבדק */
    card.onclick = e => { if (!e.target.closest('.quizgo')) onOpen(b.id, lastId); };
    cards.appendChild(card);
  });
}
