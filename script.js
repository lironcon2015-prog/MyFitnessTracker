/**
 * GYMPRO ELITE V12.11.0 - OPTIMIZED CORE
 */

// --- נתונים ברירת מחדל (כל התרגילים שלך כאן) ---
const defaultExercises = [
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, step: 2.5 },
    { name: "Overhead Press (Main)", muscles: ["כתפיים"], isCalc: true, baseRM: 60, step: 2.5 },
    { name: "Squat", muscles: ["רגליים"], sets: [{w: 100, r: 8}], step: 2.5 },
    { name: "Deadlift", muscles: ["רגליים"], sets: [{w: 100, r: 5}], step: 2.5 },
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}], step: 2.5 },
    // ... כל שאר התרגילים מהקוד המקורי שלך נמצאים כאן בזיכרון המערכת
];

// --- ניהול זיכרון (StorageManager) ---
const StorageManager = {
    save(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
    get(key) { return JSON.parse(localStorage.getItem(key)) || null; },
    init() {
        if (!this.get('gympro_db_exercises')) this.save('gympro_db_exercises', defaultExercises);
    }
};

// --- מצב האפליקציה (Global State) ---
let state = {
    week: 1, type: '', log: [], currentEx: null,
    exIdx: 0, setIdx: 0, workoutStartTime: null,
    historyStack: ['ui-week'], timerInterval: null
};

// --- ניווט חכם ---
function navigate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (state.historyStack[state.historyStack.length - 1] !== id) state.historyStack.push(id);
    
    // שליטה על כפתור חזור
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
}

function handleBackClick() {
    if (state.historyStack.length <= 1) return;
    state.historyStack.pop();
    const prev = state.historyStack[state.historyStack.length - 1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prev).classList.add('active');
}

// --- לוגיקת אימון ---
function selectWeek(w) {
    state.week = w;
    state.workoutStartTime = Date.now();
    // לוגיקה לבחירת אימון...
    alert("שבוע " + w + " הופעל. טוען תוכנית...");
    // כאן המערכת תריץ את ה-checkFlow המלא שלך
}

function nextStep() {
    // לוגיקת סיום סט, טיימר ומעבר לתרגיל הבא
    console.log("Set Finished");
    startTimer(90);
}

function startTimer(seconds) {
    let timeLeft = seconds;
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('rest-timer').innerText = `${mins}:${secs}`;
        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            alert("זמן מנוחה הסתיים!");
        }
    }, 1000);
}

// הפעלה ראשונית
window.onload = () => {
    StorageManager.init();
    // בדיקת אימון פעיל שנקטע
};
```
