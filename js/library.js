/* מסך הבית: כרטיס לכל חוברת, עם מגרש מוקטן והתקדמות. */

import { thumbnail } from './pitch.js';
import { isLearned, learnedCount, getLast } from './store.js';

const $ = id => document.getElementById(id);

export function renderLibrary(home, booklets, formations, onOpen, version) {
  $('lib-eyebrow').textContent = home.eyebrow;
  $('lib-title').textContent = home.title;
  $('lib-lede').textContent = home.lede;
  $('lib-foot').textContent = home.foot;
  document.title = home.title + ' — תשיעיות';

  /* חיווי גרסה — כדי לדעת במבט אם העדכון האחרון הגיע למכשיר */
  const ver = $('lib-ver');
  ver.textContent = version ? 'גרסה ' + version : '';

  const cards = $('cards');
  cards.textContent = '';

  booklets.forEach(b => {
    const formation = formations[b.formation];
    if (!formation) return;

    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.dataset.id = b.id;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.appendChild(thumbnail(b.scenarios[0], formation, b.role));

    const body = document.createElement('div');
    body.className = 'body';

    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = 'מספר ' + b.role;

    const h3 = document.createElement('h3');
    h3.textContent = b.title;

    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = b.lede;

    body.append(role, h3, desc);

    /* המשך מאיפה שהפסיק — רק אם באמת התחיל ולא סיים */
    const lastId = getLast(b.id);
    const done = learnedCount(b.id);
    if (lastId && done < b.scenarios.length) {
      const s = b.scenarios.find(x => x.id === lastId);
      if (s) {
        const resume = document.createElement('p');
        resume.className = 'resume';
        resume.textContent = 'המשך: ' + s.title;
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

    body.append(track, count);
    card.append(thumb, body);
    card.onclick = () => onOpen(b.id, lastId);
    cards.appendChild(card);
  });
}
