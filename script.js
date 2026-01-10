let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null, history: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null,
    isArmPhase: false, armGroup: 'biceps', 
    completedArmEx: [],
    workoutStartTime: null, workoutDurationMins: 0
};

let audioContext;
let wakeLock = null;

const unilateralExercises = [
    "Machine Row", "Cable Row", "Dumbbell Peck Fly", "Lateral Raises", 
    "Lateral Raises (DB)", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly"
];

const armExercises = {
    biceps: [
        { name: "Dumbbell Bicep Curls", sets: [{w: 12, r: 8}], step: 0.5, minW: 8, maxW: 25, rir: 2 },
        { name: "Barbell Bicep Curls", sets: [{w: 25, r: 8}], step: 1, minW: 15, maxW: 40, rir: 2 },
        { name: "Reverse Bicep Curls", sets: [{w: 15, r: 8}], step: 1, minW: 10, maxW: 25, rir: 2 }
    ],
    triceps: [
        { name: "Triceps Pushdown", sets: [{w: 35, r: 8}], step: 2.5, minW: 25, maxW: 50, rir: 2 },
        { name: "Lying Triceps Extension (French Press)", sets: [{w: 35, r: 8}], step: 2.5, minW: 25, maxW: 50, rir: 2 }
    ]
};

const workoutDisplayNames = { 'A': 'חזה וכתפיים', 'B': 'רגליים וגב', 'C': 'כתפיים, חזה וגב' };

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
            o.type = 'sine';
            o.frequency.setValueAtTime(880, audioContext.currentTime);
            g.gain.setValueAtTime(0.6, audioContext.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            o.connect(g); g.connect(audioContext.destination);
            o.start(); o.stop(audioContext.currentTime + 0.4);
        }, i * 500);
    }
}

async function initAudio() {
    playBeep(1);
    document.getElementById('audio-init-btn').innerText = "✅ סאונד פעיל";
    document.getElementById('audio-init-btn').style.background = "#28a745";
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
}

function startRestTimer() {
    stopRestTimer();
    state.seconds = 0;
    updateTimerDisplay();
    const isFirstExerciseInWorkout = (state.exIdx === 0 && !state.isArmPhase);
    const target = isFirstExerciseInWorkout ? 120 : 90;
    document.getElementById('rest-target-display').innerText = isFirstExerciseInWorkout ? "2:00" : "1:30";
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
        state.seconds = Math.floor((Date.now() - state.startTime) / 1000);
        updateTimerDisplay();
        if (state.seconds === target) playBeep(2);
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(state.seconds / 60).toString().padStart(2, '0');
    const s = (state.seconds % 60).toString().padStart(2, '0');
    document.getElementById('rest-timer').innerText = `${m}:${s}`;
}

function stopRestTimer() { if (state.timerInterval) clearInterval(state.timerInterval); state.timerInterval = null; }

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
            { name: "Cable Row", sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5, askGrip: true },
            { name: "Machine Row", sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 }
        ]},
        { name: "Calf Raise", hasVariations: true, variations: [
            { name: "Seated Calf Raise", sets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 12}], step: 5 },
            { name: "Standing Calf Raise", sets: [{w: 110, r: 10}, {w: 110, r: 10}, {w: 110, r: 12}], step: 10 }
        ]},
        { name: "Straight Arm Pulldown", sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 }
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

function navigate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'ui-main') stopRestTimer();
    state.history.push(id);
    document.getElementById('global-back').style.display = (id === 'ui-week') ? 'none' : 'block';
}

function handleGlobalBack() {
    if (state.history.length > 1) {
        state.history.pop();
        navigate(state.history.pop());
    }
}

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; state.completedArmEx = []; state.isArmPhase = false;
    state.workoutStartTime = Date.now(); // התחלת טיימר כולל
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
            btn.onclick = () => { 
                state.currentExName = v.name; 
                state.currentEx.sets = v.sets; 
                state.currentEx.isBW = v.isBW; 
                state.currentEx.step = v.step || 2.5;
                if (v.askGrip) showGripSelection(); else startRecording();
            };
            opts.appendChild(btn);
        });
        navigate('ui-variation');
    } else { state.currentExName = state.currentEx.name; startRecording(); }
}

function showGripSelection() {
    document.getElementById('variation-title').innerText = "בחר סוג אחיזה:";
    const opts = document.getElementById('variation-options'); opts.innerHTML = "";
    ['אחיזה צרה', 'אחיזה רחבה'].forEach(g => {
        const btn = document.createElement('button'); btn.className = "menu-item"; btn.innerText = g;
        btn.onclick = () => { state.currentExName += ` (${g})`; startRecording(); };
        opts.appendChild(btn);
    });
    navigate('ui-variation');
}

function startArmWorkout() { state.isArmPhase = true; state.armGroup = 'biceps'; showArmSelection(); }

function showArmSelection() {
    const list = armExercises[state.armGroup];
    const remaining = list.filter(ex => !state.completedArmEx.includes(ex.name));
    if (remaining.length === 0) {
        if (state.armGroup === 'biceps') { state.armGroup = 'triceps'; showArmSelection(); }
        else finish();
        return;
    }
    document.getElementById('arm-selection-title').innerText = state.armGroup === 'biceps' ? "בחר תרגיל בייספס:" : "בחר תרגיל טרייספס:";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    remaining.forEach(ex => {
        const btn = document.createElement('button'); btn.className = "menu-item"; btn.innerText = ex.name;
        btn.onclick = () => { 
            state.currentEx = JSON.parse(JSON.stringify(ex));
            state.currentExName = ex.name;
            state.currentEx.sets = [ex.sets[0], ex.sets[0], ex.sets[0]];
            startRecording();
        };
        opts.appendChild(btn);
    });
    const skipBtn = document.getElementById('btn-skip-arm-group');
    skipBtn.innerText = state.armGroup === 'biceps' ? "דלג לטרייספס" : "סיים אימון";
    skipBtn.onclick = () => {
        if (state.armGroup === 'biceps') { state.armGroup = 'triceps'; showArmSelection(); }
        else finish();
    };
    navigate('ui-arm-selection');
}

function startRecording() { 
    state.setIdx = 0; 
    stopRestTimer(); 
    state.seconds = 0;
    updateTimerDisplay();
    navigate('ui-main'); 
    initPickers(); 
}

function initPickers() {
    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `Set ${state.setIdx + 1}/${state.currentEx.sets.length}`;
    
    const timerArea = document.getElementById('timer-area');
    if (state.setIdx > 0) {
        timerArea.style.visibility = 'visible';
        startRestTimer();
    } else {
        timerArea.style.visibility = 'hidden';
        stopRestTimer();
    }

    const isUnilateral = unilateralExercises.some(u => state.currentExName.includes(u));
    document.getElementById('unilateral-note').style.display = isUnilateral ? 'block' : 'none';

    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    const step = state.currentEx.step || 2.5;
    const min = state.currentEx.minW || Math.max(0, target.w - 40);
    const max = state.currentEx.maxW || target.w + 40;
    for(let i = min; i <= max; i = parseFloat((i + step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === target.w) o.selected = true; wPick.add(o);
    }
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    for(let i = 1; i <= 25; i++) { let o = new Option(i, i); if(i === target.r) o.selected = true; rPick.add(o); }
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "0 (Fail)" : v, v); if(v === (state.currentEx.rir || 2)) o.selected = true; rirPick.add(o);
    });
}

function nextStep() {
    const isUni = unilateralExercises.some(u => state.currentExName.includes(u));
    const finalExName = state.currentExName + (isUni && state.currentExName === "Dumbbell Bicep Curls" ? " (בכל יד)" : (isUni ? " (לצד אחד)" : ""));
    
    state.log.push({ 
        exName: finalExName, 
        w: document.getElementById('weight-picker').value, 
        r: document.getElementById('reps-picker').value, 
        rir: document.getElementById('rir-picker').value,
        isArm: state.isArmPhase
    });

    if (state.setIdx < state.currentEx.sets.length - 1) { 
        state.setIdx++; initPickers(); 
    } else { 
        navigate('ui-extra'); 
    }
}

function handleExtra(extra) {
    if(extra) { 
        state.setIdx++; 
        state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]}); 
        initPickers(); 
        navigate('ui-main'); 
    } else { 
        if (state.isArmPhase) {
            state.completedArmEx.push(state.currentExName);
            showArmSelection();
        } else {
            state.exIdx++; 
            checkFlow(); 
        }
    }
}

function checkFlow() { 
    if (state.exIdx < workouts[state.type].length) showConfirmScreen(); 
    else navigate('ui-ask-arms'); 
}

function finish() {
    const now = Date.now();
    state.workoutDurationMins = Math.floor((now - state.workoutStartTime) / 60000);
    
    navigate('ui-summary');
    let summaryText = `סיכום אימון ${workoutDisplayNames[state.type]} - שבוע ${state.week}\n---\n`;
    
    state.log.forEach(l => {
        if(l.skip) summaryText += `${l.exName}: לא בוצע היום\n`;
        else summaryText += `${l.exName}: ${l.w}kg x ${l.r} (RIR ${l.rir})\n`;
    });

    summaryText += `---\nמשך אימון כולל: ${state.workoutDurationMins} דקות`;

    document.getElementById('summary-area').innerText = summaryText;
}

function copyResult() {
    const text = document.getElementById('summary-area').innerText;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert("הסיכום הועתק ללוח!");
            location.reload();
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert("הסיכום הועתק ללוח!");
        } catch (err) {
            alert("שגיאה בהעתקה, אנא העתק ידנית");
        }
        document.body.removeChild(textArea);
        location.reload();
    }
}
