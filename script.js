let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null, history: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null
};

let audioContext;
let swRegistration = null;

// רישום ותחזוקת ה-Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            swRegistration = reg;
            console.log('SW Active');
        });
    });
}

function playBeep(times = 1) {
    if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    for (let i = 0; i < times; i++) {
        setTimeout(() => {
            const o = audioContext.createOscillator();
            const g = audioContext.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(880, audioContext.currentTime);
            g.gain.setValueAtTime(0.5, audioContext.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            o.connect(g); g.connect(audioContext.destination);
            o.start(); o.stop(audioContext.currentTime + 0.4);
        }, i * 450);
    }
}

async function initAudioAndNotifications() {
    playBeep(1);
    if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted" && swRegistration) {
            swRegistration.showNotification("Workout Tracker", { body: "התראות רקע מוכנות ✅" });
        }
    }
    document.getElementById('audio-init-btn').innerText = "✅ סאונד והתראות פעילים";
    document.getElementById('audio-init-btn').style.background = "#28a745";
}

function startRestTimer() {
    stopRestTimer();
    state.startTime = Date.now();
    state.seconds = 0;
    updateTimerDisplay();

    // שלח הוראת תזמון ל-Service Worker מיד עם תחילת המנוחה
    if (Notification.permission === "granted" && navigator.serviceWorker.controller) {
        // התראה ראשונה
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIF',
            title: "זמן מנוחה",
            message: "עברו 90 שניות! הסט הבא מחכה.",
            delay: 90000
        });
        // התראה שנייה
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIF',
            title: "זמן מנוחה",
            message: "עברו 2 דקות! חזרה לעבודה!",
            delay: 120000
        });
    }

    state.timerInterval = setInterval(() => {
        state.seconds = Math.floor((Date.now() - state.startTime) / 1000);
        updateTimerDisplay();
        if (state.seconds === 90) playBeep(2);
        if (state.seconds === 120) playBeep(3);
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(state.seconds / 60).toString().padStart(2, '0');
    const s = (state.seconds % 60).toString().padStart(2, '0');
    const el = document.getElementById('rest-timer');
    if (el) el.innerText = `${m}:${s}`;
}

function stopRestTimer() { 
    if (state.timerInterval) clearInterval(state.timerInterval); 
    state.timerInterval = null; 
}

// נתוני האימונים עם השמות המלאים
const workoutDisplayNames = { 'A': 'חזה וכתפיים', 'B': 'רגליים וגב', 'C': 'כתפיים, חזה וגב' };

const workouts = {
    'A': [
        { name: "Bench Press (Main)", isCalc: true, baseRM: 122.5, rmRange: [110, 160] },
        { name: "Incline Bench Press", sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
        { name: "Chest Flyes", hasVariations: true, variations: [
            { name: "Dumbbell Peck Fly", sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
            { name: "Machine Peck Fly", sets: [{w: 45, r: 11}, {w: 45, r: 11}, {w: 45, r: 11}], step: 1 },
            { name: "Cable Fly", sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 }
        ]},
        { name: "Lateral Raises", sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
        { name: "Face Pulls", sets: [{w: 40, r: 13}, {w: 40, r: 13}, {w: 40, r: 15}], step: 2.5 }
    ],
    'B': [
        { name: "Leg Press", sets: [{w: 280, r: 8}, {w: 300, r: 8}, {w: 300, r: 7}], step: 5 },
        { name: "Leg Curl", hasVariations: true, variations: [
            { name: "Single Leg Curl", sets: [{w: 25, r: 8}, {w: 30, r: 6}, {w: 25, r: 8}], step: 2.5 },
            { name: "Lying Leg Curl (Double)", sets: [{w: 50, r: 8}, {w: 60, r: 6}, {w: 50, r: 8}], step: 5 },
            { name: "Seated Leg Curl (Double)", sets: [{w: 50, r: 8}, {w: 60, r: 6}, {w: 50, r: 8}], step: 5 }
        ]},
        { name: "Vertical Pull", hasVariations: true, variations: [
            { name: "Lat Pulldown", sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 },
            { name: "Pull Ups", isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}] }
        ]},
        { name: "Seated Row", hasVariations: true, variations: [
            { name: "Cable Row", sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 },
            { name: "Machine Row", sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 }
        ]},
        { name: "Calf Raise", hasVariations: true, variations: [
            { name: "Seated Calf Raise", sets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 12}], step: 5 },
            { name: "Standing Calf Raise", sets: [{w: 110, r: 10}, {w: 110, r: 10}, {w: 110, r: 12}], step: 10 }
        ]},
        { name: "Straight Arm Pulldown", sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
        { name: "Bicep Curls", sets: [{w: 16, r: 8}, {w: 16, r: 8}, {w: 16, r: 6}], step: 2 }
    ],
    'C': [
        { name: "Overhead Press (Main)", isCalc: true, baseRM: 77.5, rmRange: [65, 90] },
        { name: "Barbell Shrugs", sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
        { name: "Lateral Raises (DB)", sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
        { name: "Face Pull (Cable)", sets: [{w: 37.5, r: 12}, {w: 37.5, r: 12}, {w: 37.5, r: 13}], step: 2.5 },
        { name: "Pull Ups Variation", hasVariations: true, variations: [
            { name: "Pull Ups (BW)", sets: [{w: 0, r: 8}, {w: 0, r: 7}, {w: 0, r: 7}], isBW: true },
            { name: "Weighted Pull Ups", sets: [{w: 5, r: 8}, {w: 5, r: 7}, {w: 5, r: 7}], step: 2.5 }
        ]},
        { name: "Incline Bench Press", sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 }
    ]
};

// ניווט
function navigate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'ui-main') stopRestTimer();
    if (state.history[state.history.length - 1] !== id) state.history.push(id);
    document.getElementById('global-back').style.display = (id === 'ui-week') ? 'none' : 'block';
}

function handleGlobalBack() {
    if (state.history.length > 1) {
        state.history.pop();
        const prev = state.history[state.history.length - 1];
        if (prev === 'ui-main' && state.setIdx > 0) { state.setIdx--; state.log.pop(); }
        navigate(prev);
    }
}

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = [];
    const ex = workouts[t][0];
    if (ex.isCalc) {
        document.getElementById('rm-title').innerText = `1RM ב-${ex.name.split(' ')[0]}?`;
        const p = document.getElementById('rm-picker'); p.innerHTML = "";
        for(let i = ex.rmRange[0]; i <= ex.rmRange[1]; i += 2.5) {
            let o = new Option(i + " kg", i); if(i === ex.baseRM) o.selected = true; p.add(o);
        }
        navigate('ui-1rm');
    } else { showConfirmScreen(); }
}

function save1RM() { state.rm = parseFloat(document.getElementById('rm-picker').value); showConfirmScreen(); }
function showConfirmScreen() {
    const ex = workouts[state.type][state.exIdx];
    document.getElementById('confirm-ex-name').innerText = ex.name;
    navigate('ui-confirm');
}

function confirmExercise(doEx) {
    if (!doEx) { state.log.push({ skip: true, exName: workouts[state.type][state.exIdx].name }); state.exIdx++; checkFlow(); return; }
    state.currentEx = JSON.parse(JSON.stringify(workouts[state.type][state.exIdx]));
    if (state.currentEx.isCalc) {
        const p = { 1: [0.65, 0.75, 0.85, 0.75, 0.65], 2: [0.70, 0.80, 0.90, 0.80, 0.70, 0.70], 3: [0.75, 0.85, 0.95, 0.85, 0.75, 0.75] };
        const r = { 1: [3, 3, 5, 8, 10], 2: [3, 3, 3, 8, 10, 10], 3: [3, 3, 3, 8, 10, 10] };
        state.currentEx.sets = p[state.week].map((pct, i) => ({ w: Math.round((state.rm * pct) / 2.5) * 2.5, r: r[state.week][i] }));
        state.currentExName = state.currentEx.name;
        startRecording();
    } else if (state.currentEx.hasVariations) {
        const opts = document.getElementById('variation-options'); opts.innerHTML = "";
        state.currentEx.variations.forEach(v => {
            const btn = document.createElement('button'); btn.className = "menu-item"; btn.innerText = v.name;
            btn.onclick = () => { state.currentExName = v.name; state.currentEx.sets = v.sets; state.currentEx.isBW = v.isBW; state.currentEx.step = v.step || 2.5; startRecording(); };
            opts.appendChild(btn);
        });
        navigate('ui-variation');
    } else { state.currentExName = state.currentEx.name; startRecording(); }
}

function startRecording() { state.setIdx = 0; stopRestTimer(); state.seconds = 0; updateTimerDisplay(); navigate('ui-main'); initPickers(); }

function initPickers() {
    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `Set ${state.setIdx + 1}/${state.currentEx.sets.length}`;
    if (state.setIdx > 0) startRestTimer();
    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    if (state.currentEx.isBW) { wPick.add(new Option("BW", 0)); } 
    else {
        const s = state.currentEx.step || 2.5;
        for(let i = Math.max(0, target.w - 40); i <= target.w + 40; i += s) {
            let v = parseFloat(i.toFixed(1));
            let o = new Option(v + " kg", v); if(v === target.w) o.selected = true; wPick.add(o);
        }
    }
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    for(let i = 1; i <= 25; i++) { let o = new Option(i, i); if(i === target.r) o.selected = true; rPick.add(o); }
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "0 (Fail)" : v, v); if(v === 2) o.selected = true; rirPick.add(o);
    });
}

function nextStep() {
    state.log.push({ exName: state.currentExName, w: document.getElementById('weight-picker').value, r: document.getElementById('reps-picker').value, rir: document.getElementById('rir-picker').value, isBW: state.currentEx.isBW });
    if (state.setIdx < state.currentEx.sets.length - 1) { state.setIdx++; initPickers(); } else { navigate('ui-extra'); }
}

function handleExtra(extra) {
    if(extra) { state.setIdx++; state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]}); initPickers(); navigate('ui-main'); } 
    else { state.exIdx++; checkFlow(); }
}

function checkFlow() { if (state.exIdx < workouts[state.type].length) showConfirmScreen(); else finish(); }

function finish() {
    navigate('ui-summary');
    let t = `סיכום אימון ${workoutDisplayNames[state.type]} - שבוע ${state.week}\n---\n`;
    state.log.forEach(l => { if(l.skip) t += `${l.exName}: דלג\n`; else t += `${l.exName}: ${l.isBW ? 'BW' : l.w+'kg'} x ${l.r} (RIR ${l.rir})\n`; });
    document.getElementById('summary-area').innerText = t;
}

function copyResult() { navigator.clipboard.writeText(document.getElementById('summary-area').innerText).then(() => { alert("הועתק!"); location.reload(); }); }
