let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null,
    historyStack: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null,
    isArmPhase: false, armGroup: 'biceps', 
    completedArmEx: [],
    workoutStartTime: null, workoutDurationMins: 0,
    lastLoggedSet: null 
};

let audioContext;
let wakeLock = null;

const unilateralExercises = ["Dumbbell Peck Fly", "Lateral Raises", "Lateral Raises (DB)", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly"];

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

const workoutDisplayNames = { 'A': 'חזה וכתפיים', 'B': 'רגליים וגב', 'C': 'כתפיים, חזה וגב' };

function playBeep(times = 1) {
    if (!audioContext) { const AudioCtx = window.AudioContext || window.webkitAudioContext; audioContext = new AudioCtx(); }
    if (audioContext.state === 'suspended') audioContext.resume();
    for (let i = 0; i < times; i++) {
        setTimeout(() => {
            const o = audioContext.createOscillator();
            const g = audioContext.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(880, audioContext.currentTime);
            g.gain.setValueAtTime(0.3, audioContext.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            o.connect(g); g.connect(audioContext.destination);
            o.start(); o.stop(audioContext.currentTime + 0.4);
        }, i * 500);
    }
}

async function initAudio() {
    playBeep(1);
    document.getElementById('audio-init-btn').innerText = "מצב אימון פעיל";
    document.getElementById('audio-init-btn').style.backgroundColor = "#32d74b";
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
}

function startRestTimer() {
    stopRestTimer();
    state.seconds = 0;
    const isFirstEx = (state.exIdx === 0 && !state.isArmPhase);
    const target = isFirstEx ? 120 : 90;
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
        state.seconds = Math.floor((Date.now() - state.startTime) / 1000);
        updateTimerUI(target);
        if (state.seconds === target) playBeep(2);
    }, 1000);
}

function updateTimerUI(target) {
    const m = Math.floor(state.seconds / 60).toString().padStart(2, '0');
    const s = (state.seconds % 60).toString().padStart(2, '0');
    document.getElementById('rest-timer').innerText = `${m}:${s}`;
    const progress = Math.min((state.seconds / target) * 100, 100);
    if(document.getElementById('timer-bar')) document.getElementById('timer-bar').style.width = progress + "%";
}

function stopRestTimer() { 
    if (state.timerInterval) clearInterval(state.timerInterval); 
    state.timerInterval = null; 
    if(document.getElementById('timer-bar')) document.getElementById('timer-bar').style.width = "0%";
}

function navigate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'ui-main') stopRestTimer();
    
    if (state.historyStack[state.historyStack.length - 1] !== id) {
        state.historyStack.push(id);
    }
    
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
}

function handleBackClick() {
    const currentScreen = state.historyStack[state.historyStack.length - 1];

    if (currentScreen === 'ui-main') {
        if (state.setIdx > 0) {
            // אם אנחנו בתוך תרגיל, "חזור" מבטל את הסט האחרון שנרשם בלוג
            state.log.pop();
            state.setIdx--;
            // עדכון ה-lastLoggedSet לסט שקדם לסט שמחקנו כרגע
            const currentExName = state.currentExName;
            const previousLogs = state.log.filter(l => l.exName && l.exName.includes(currentExName));
            state.lastLoggedSet = previousLogs.length > 0 ? previousLogs[previousLogs.length-1] : null;
            initPickers();
            return;
        }
    }
    
    if (state.historyStack.length <= 1) return;
    state.historyStack.pop(); 
    const prevScreen = state.historyStack.pop(); 
    navigate(prevScreen);
}

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; state.completedArmEx = []; state.isArmPhase = false;
    state.workoutStartTime = Date.now();
    const ex = workouts[t][0];
    if (ex.isCalc) {
        document.getElementById('rm-title').innerText = `${ex.name.split(' ')[0]} 1RM`;
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
        // חישוב אחוזי משקל
        const p = { 
            1: [0.65, 0.75, 0.85, 0.75, 0.65], 
            2: [0.70, 0.80, 0.90, 0.80, 0.70, 0.70], 
            3: [0.75, 0.85, 0.95, 0.85, 0.75, 0.75] 
        };
        
        // הגדרת חזרות חדשה לפי שבועות
        let reps;
        if (state.currentEx.name === "Leg Press") {
             reps = [8, 8, 7]; // שמירה על המקורי של לג פרס
        } else {
             // Bench Press & OHP
             if (state.week === 1) reps = [5, 5, 5, 8, 10];
             else if (state.week === 2) reps = [3, 3, 3, 8, 10, 10];
             else reps = [5, 3, 1, 8, 10, 10]; // שבוע 3
        }

        state.currentEx.sets = p[state.week].map((pct, i) => ({ 
            w: Math.round((state.rm * pct) / 2.5) * 2.5, 
            r: reps[i] || 10 
        }));
        
        state.currentExName = state.currentEx.name;
        startRecording();
    } else if (state.currentEx.hasVariations) {
        const opts = document.getElementById('variation-options'); opts.innerHTML = "";
        state.currentEx.variations.forEach(v => {
            const btn = document.createElement('button'); btn.className = "btn-secondary"; btn.innerText = v.name;
            btn.onclick = () => { 
                state.currentExName = v.name; state.currentEx.sets = v.sets; 
                state.currentEx.isBW = v.isBW; state.currentEx.step = v.step || 2.5;
                if (v.askGrip) showGripSelection(); else startRecording();
            };
            opts.appendChild(btn);
        });
        navigate('ui-variation');
    } else { state.currentExName = state.currentEx.name; startRecording(); }
}

function showGripSelection() {
    document.getElementById('variation-title').innerText = "סוג אחיזה";
    const opts = document.getElementById('variation-options'); opts.innerHTML = "";
    ['אחיזה צרה', 'אחיזה רחבה'].forEach(g => {
        const btn = document.createElement('button'); btn.className = "btn-secondary"; btn.innerText = g;
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
        else finish(); return;
    }
    document.getElementById('arm-selection-title').innerText = state.armGroup === 'biceps' ? "בחר בייספס" : "בחר טרייספס";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    remaining.forEach(ex => {
        const btn = document.createElement('button'); btn.className = "btn-secondary"; btn.innerText = ex.name;
        btn.onclick = () => { 
            state.currentEx = JSON.parse(JSON.stringify(ex)); state.currentExName = ex.name;
            state.currentEx.sets = [ex.sets[0], ex.sets[0], ex.sets[0]]; startRecording();
        };
        opts.appendChild(btn);
    });
    const skipBtn = document.getElementById('btn-skip-arm-group');
    skipBtn.innerText = state.armGroup === 'biceps' ? "דלג לטרייספס" : "סיים אימון";
    skipBtn.onclick = () => { if (state.armGroup === 'biceps') { state.armGroup = 'triceps'; showArmSelection(); } else finish(); };
    navigate('ui-arm-selection');
}

function startRecording() { state.setIdx = 0; state.lastLoggedSet = null; stopRestTimer(); navigate('ui-main'); initPickers(); }

function initPickers() {
    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `SET ${state.setIdx + 1}/${state.currentEx.sets.length}`;
    
    const histDiv = document.getElementById('last-set-info');
    if (state.lastLoggedSet) {
        histDiv.innerText = `סט קודם: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
        histDiv.style.display = 'block';
    } else {
        histDiv.style.display = 'none';
    }

    const timerArea = document.getElementById('timer-area');
    if (state.setIdx > 0) { timerArea.style.visibility = 'visible'; startRestTimer(); } 
    else { timerArea.style.visibility = 'hidden'; stopRestTimer(); }

    const isUni = unilateralExercises.some(u => state.currentExName.includes(u));
    document.getElementById('unilateral-note').style.display = isUni ? 'block' : 'none';

    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    const step = state.currentEx.step || 2.5;
    const currentW = target ? target.w : 0;
    for(let i = (state.currentEx.minW || Math.max(0, currentW - 40)); i <= (state.currentEx.maxW || currentW + 40); i = parseFloat((i + step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === currentW) o.selected = true; wPick.add(o);
    }
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    const currentR = target ? target.r : 8;
    for(let i = 1; i <= 25; i++) { let o = new Option(i, i); if(i === currentR) o.selected = true; rPick.add(o); }
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "0 (Fail)" : v, v); if(v === (state.currentEx.rir || 2)) o.selected = true; rirPick.add(o);
    });
}

function nextStep() {
    const isUni = unilateralExercises.some(u => state.currentExName.includes(u));
    const finalExName = state.currentExName + (isUni && state.currentExName === "Dumbbell Bicep Curls" ? " (בכל יד)" : (isUni ? " (לצד אחד)" : ""));
    const currentSetData = { 
        exName: finalExName, 
        w: parseFloat(document.getElementById('weight-picker').value), 
        r: parseInt(document.getElementById('reps-picker').value), 
        rir: document.getElementById('rir-picker').value 
    };
    state.log.push(currentSetData);
    state.lastLoggedSet = currentSetData;
    if (state.setIdx < state.currentEx.sets.length - 1) { state.setIdx++; initPickers(); } else { navigate('ui-extra'); }
}

function handleExtra(extra) {
    if(extra) { state.setIdx++; state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]}); initPickers(); navigate('ui-main'); } 
    else { if (state.isArmPhase) { state.completedArmEx.push(state.currentExName); showArmSelection(); } else { state.exIdx++; checkFlow(); } }
}

function checkFlow() { if (state.exIdx < workouts[state.type].length) showConfirmScreen(); else navigate('ui-ask-arms'); }

function finish() {
    state.workoutDurationMins = Math.floor((Date.now() - state.workoutStartTime) / 60000);
    navigate('ui-summary');
    
    let summaryText = `סיכום אימון ${workoutDisplayNames[state.type]}\nשבוע ${state.week} | משך: ${state.workoutDurationMins} דקות\n\n`;
    
    let groupedLog = {};
    state.log.forEach(entry => {
        if (!groupedLog[entry.exName]) groupedLog[entry.exName] = { sets: [], totalVol: 0, skipped: false };
        if (entry.skip) { groupedLog[entry.exName].skipped = true; }
        else {
            groupedLog[entry.exName].sets.push(`${entry.w}kg x ${entry.r} (RIR ${entry.rir})`);
            groupedLog[entry.exName].totalVol += (entry.w * entry.r);
        }
    });

    for (let ex in groupedLog) {
        summaryText += `${ex}:\n`;
        if (groupedLog[ex].skipped) {
            summaryText += `לא בוצע\n\n`;
        } else {
            summaryText += groupedLog[ex].sets.join('\n') + `\n`;
            summaryText += `נפח כולל: ${groupedLog[ex].totalVol} ק"ג\n\n`;
        }
    }
    
    document.getElementById('summary-area').innerText = summaryText.trim();
}

function copyResult() {
    const text = document.getElementById('summary-area').innerText;
    const textArea = document.createElement("textarea"); textArea.value = text; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); alert("הסיכום הועתק"); } catch (err) { alert("שגיאה בהעתקה"); }
    document.body.removeChild(textArea); location.reload();
}
