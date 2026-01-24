/**
 * GYMPRO ELITE V11.5.0
 * - NEW: Freestyle Arms (Merged Biceps/Triceps)
 * - FIX: History Card UI (Pill design, LTR fix)
 */

// --- GLOBAL STATE ---
let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null, currentExName: '',
    historyStack: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null,
    isArmPhase: false, isFreestyle: false, isExtraPhase: false, isInterruption: false,
    currentMuscle: '',
    completedExInSession: [],
    workoutStartTime: null, workoutDurationMins: 0,
    lastLoggedSet: null,
    firstArmGroup: null, 
    secondArmGroup: null,
    lastWorkoutDetails: {}, // To store grouped details for archive
    // Archive State
    archiveView: 'list', // 'list' or 'calendar'
    calendarOffset: 0, // Months from current
    // Edit State
    editingIndex: -1
};

let audioContext;
let wakeLock = null;
let currentArchiveItem = null;
let selectedArchiveIds = new Set(); 

// --- LOCAL STORAGE MANAGER ---
const StorageManager = {
    KEY_WEIGHTS: 'gympro_weights',
    KEY_RM: 'gympro_rm',
    KEY_ARCHIVE: 'gympro_archive',

    getData(key) {
        try { return JSON.parse(localStorage.getItem(key)) || {}; } 
        catch { return {}; }
    },

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    getLastWeight(exName) {
        const data = this.getData(this.KEY_WEIGHTS);
        return data[exName] || null;
    },

    saveWeight(exName, weight) {
        const data = this.getData(this.KEY_WEIGHTS);
        data[exName] = weight;
        this.saveData(this.KEY_WEIGHTS, data);
    },

    getLastRM(exName) {
        const data = this.getData(this.KEY_RM);
        return data[exName] || null;
    },

    saveRM(exName, rmVal) {
        const data = this.getData(this.KEY_RM);
        data[exName] = rmVal;
        this.saveData(this.KEY_RM, data);
    },

    saveToArchive(workoutObj) {
        let history = JSON.parse(localStorage.getItem(this.KEY_ARCHIVE)) || [];
        history.unshift(workoutObj);
        localStorage.setItem(this.KEY_ARCHIVE, JSON.stringify(history));
    },

    getArchive() {
        return JSON.parse(localStorage.getItem(this.KEY_ARCHIVE)) || [];
    },
    
    deleteFromArchive(timestamp) {
        let history = this.getArchive();
        history = history.filter(h => h.timestamp !== timestamp);
        localStorage.setItem(this.KEY_ARCHIVE, JSON.stringify(history));
    },

    getAllData() {
        return {
            weights: this.getData(this.KEY_WEIGHTS),
            rms: this.getData(this.KEY_RM),
            archive: this.getArchive()
        };
    },

    restoreData(dataObj) {
        if(dataObj.weights) this.saveData(this.KEY_WEIGHTS, dataObj.weights);
        if(dataObj.rms) this.saveData(this.KEY_RM, dataObj.rms);
        if(dataObj.archive) localStorage.setItem(this.KEY_ARCHIVE, JSON.stringify(dataObj.archive));
    }
};

// --- DATABASE ---
const unilateralExercises = ["Dumbbell Peck Fly", "Lateral Raises", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly", "Concentration Curls"];
const heavyCompounds = ["Overhead Press (Main)", "Bench Press (Main)", "Squat", "Deadlift"];

const exerciseDatabase = [
    { name: "Overhead Press (Main)", muscles: ["כתפיים"], isCalc: true, baseRM: 60, rmRange: [50, 100], manualRange: {base: 50, min: 40, max: 80, step: 2.5} },
    { name: "Lateral Raises", muscles: ["כתפיים"], sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
    { name: "Weighted Pull Ups", muscles: ["גב"], sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 40, isBW: true },
    { name: "Face Pulls", muscles: ["כתפיים"], sets: [{w: 40, r: 13}, {w: 40, r: 13}, {w: 40, r: 15}], step: 2.5 },
    { name: "Barbell Shrugs", muscles: ["כתפיים"], sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, rmRange: [80, 150], manualRange: {base: 85, min: 60, max: 140, step: 2.5} },
    { name: "Incline Bench Press", muscles: ["חזה"], sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
    { name: "Dumbbell Peck Fly", muscles: ["חזה"], sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
    { name: "Machine Peck Fly", muscles: ["חזה"], sets: [{w: 45, r: 11}, {w: 45, r: 11}, {w: 45, r: 11}], step: 1 },
    { name: "Cable Fly", muscles: ["חזה"], sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 },
    { name: "Leg Press", muscles: ["רגליים"], sets: [{w: 280, r: 8}, {w: 300, r: 8}, {w: 300, r: 7}], step: 5 },
    { name: "Squat", muscles: ["רגליים"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Deadlift", muscles: ["רגליים"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Romanian Deadlift", muscles: ["רגליים"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Single Leg Curl", muscles: ["רגליים"], sets: [{w: 25, r: 8}, {w: 30, r: 6}, {w: 25, r: 8}], step: 2.5 },
    { name: "Lying Leg Curl (Double)", muscles: ["רגליים"], sets: [{w: 50, r: 8}, {w: 60, r: 6}, {w: 50, r: 8}], step: 5 },
    { name: "Seated Leg Curl", muscles: ["רגליים"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 10}], step: 5 }, 
    { name: "Seated Calf Raise", muscles: ["רגליים"], sets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 12}], step: 5 },
    { name: "Standing Calf Raise", muscles: ["רגליים"], sets: [{w: 110, r: 10}, {w: 110, r: 10}, {w: 110, r: 12}], step: 10 },
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 },
    { name: "Pull Ups", muscles: ["גב"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}] },
    { name: "Cable Row", muscles: ["גב"], sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 },
    { name: "Machine Row", muscles: ["גב"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 },
    { name: "Straight Arm Pulldown", muscles: ["גב"], sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Back Extension", muscles: ["גב"], sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}], step: 5, minW: 0, maxW: 50, isBW: true }
];

const armExercises = {
    biceps: [
        { name: "Dumbbell Bicep Curls", sets: [{w: 12, r: 8}], step: 0.5 },
        { name: "Barbell Bicep Curls", sets: [{w: 25, r: 8}], step: 1 },
        { name: "Concentration Curls", sets: [{w: 10, r: 10}], step: 0.5 }
    ],
    triceps: [
        { name: "Triceps Pushdown", sets: [{w: 35, r: 8}], step: 2.5 },
        { name: "Lying Triceps Extension", sets: [{w: 25, r: 8}], step: 2.5 }
    ]
};

const workouts = {
    'A': ["Overhead Press (Main)", "Barbell Shrugs", "Lateral Raises", "Weighted Pull Ups", "Face Pulls", "Incline Bench Press"],
    'B': ["Leg Press", "Single Leg Curl", "Lat Pulldown", "Cable Row", "Seated Calf Raise", "Straight Arm Pulldown"],
    'C': ["Bench Press (Main)", "Incline Bench Press", "Dumbbell Peck Fly", "Lateral Raises", "Face Pulls"]
};

const variationMap = {
    'B': { 1: ["Single Leg Curl", "Lying Leg Curl (Double)", "Seated Leg Curl"], 3: ["Cable Row", "Machine Row"], 4: ["Seated Calf Raise", "Standing Calf Raise"] },
    'C': { 2: ["Dumbbell Peck Fly", "Machine Peck Fly", "Cable Fly"] }
};

const workoutNames = { 'A': "אימון A (כתפיים-חזה-גב)", 'B': "אימון B (רגליים-גב)", 'C': "אימון C (חזה-כתפיים)", 'Freestyle': "Freestyle" };

// --- CORE SYSTEMS ---

function haptic(type = 'light') {
    if (!("vibrate" in navigator)) return;
    try {
        if (type === 'light') navigator.vibrate(20); 
        else if (type === 'medium') navigator.vibrate(40);
        else if (type === 'success') navigator.vibrate([50, 50, 50]);
        else if (type === 'warning') navigator.vibrate([30, 30]);
    } catch(e) {}
}

function playBeep(times = 1) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    haptic('medium');
    playBeep(1);
    const btn = document.getElementById('audio-init-btn');
    btn.innerHTML = `<div class="card-icon">✅</div><div class="card-text">מצב אימון פעיל</div>`;
    btn.style.background = "var(--success-gradient)";
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
}

function navigate(id) {
    haptic('light');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id !== 'ui-main') stopRestTimer();
    if (state.historyStack[state.historyStack.length - 1] !== id) state.historyStack.push(id);
    
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
}

function handleBackClick() {
    haptic('warning');
    if (state.historyStack.length <= 1) return;

    const currentScreen = state.historyStack[state.historyStack.length - 1];

    if (currentScreen === 'ui-main' && state.setIdx > 0) {
        state.log.pop();
        state.setIdx--;
        state.lastLoggedSet = state.log.length > 0 ? state.log[state.log.length - 1] : null;
        
        // Restore UI if we were in "Done" state
        document.getElementById('action-panel').style.display = 'none';
        document.getElementById('btn-submit-set').style.display = 'block';
        
        initPickers();
        return;
    }

    if (currentScreen === 'ui-archive') { state.historyStack.pop(); navigate('ui-week'); return; }
    if (currentScreen === 'ui-archive-detail') { state.historyStack.pop(); navigate('ui-archive'); return; }
    if (currentScreen === 'ui-swap-list') { state.historyStack.pop(); navigate('ui-confirm'); return; }

    state.historyStack.pop();
    const prevScreen = state.historyStack[state.historyStack.length - 1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prevScreen).classList.add('active');
    document.getElementById('global-back').style.visibility = (prevScreen === 'ui-week') ? 'hidden' : 'visible';
}

// --- WORKOUT FLOW ---

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; 
    state.completedExInSession = []; state.isArmPhase = false; state.isFreestyle = false; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    showConfirmScreen();
}

function startFreestyle() {
    state.type = 'Freestyle'; state.log = []; state.completedExInSession = [];
    state.isArmPhase = false; state.isFreestyle = true; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    document.getElementById('btn-resume-flow').style.display = 'none';
    document.getElementById('btn-finish-extra').style.display = 'none';
    navigate('ui-muscle-select');
}

function showExerciseList(muscle) {
    state.currentMuscle = muscle;
    const options = document.getElementById('variation-options');
    options.innerHTML = "";
    document.getElementById('variation-title').innerText = `תרגילי ${muscle}`;
    
    if (state.isFreestyle) {
        const backBtn = document.createElement('button');
        backBtn.className = "btn-text";
        backBtn.style.color = "var(--accent)";
        backBtn.style.textAlign = "right";
        backBtn.style.marginBottom = "10px";
        backBtn.style.padding = "5px";
        backBtn.innerHTML = "🡠 חזור לבחירת קבוצת שריר";
        backBtn.onclick = () => navigate('ui-muscle-select'); 
        options.appendChild(backBtn);
    }

    // HANDLER FOR ARMS IN FREESTYLE
    if (muscle === 'ידיים') {
        const allArms = [...armExercises.biceps, ...armExercises.triceps];
        allArms.forEach(ex => {
            const btn = document.createElement('button');
            btn.className = "menu-card";
            btn.innerHTML = `<span>${ex.name}</span><div class="arrow">➔</div>`;
            btn.onclick = () => {
                state.currentEx = JSON.parse(JSON.stringify(ex));
                state.currentExName = ex.name;
                // Standardize to 3 sets for Freestyle
                state.currentEx.sets = [ex.sets[0], ex.sets[0], ex.sets[0]];
                startRecording();
            };
            options.appendChild(btn);
        });
        navigate('ui-variation');
        return;
    }

    const filtered = exerciseDatabase.filter(ex => ex.muscles.includes(muscle) && !state.completedExInSession.includes(ex.name));
    
    filtered.forEach(ex => {
        const btn = document.createElement('button');
        btn.className = "menu-card";
        btn.innerHTML = `<span>${ex.name}</span><div class="arrow">➔</div>`;
        btn.onclick = () => {
            const dbRef = exerciseDatabase.find(d => d.name === ex.name);
            state.currentEx = JSON.parse(JSON.stringify(dbRef));
            state.currentExName = ex.name;
            if (state.currentEx.isCalc) {
                state.currentEx.sets = Array(3).fill({w: state.currentEx.manualRange.base, r: 8});
                state.currentEx.step = state.currentEx.manualRange.step;
            }
            startRecording();
        };
        options.appendChild(btn);
    });
    navigate('ui-variation');
}

function getLastPerformance(exName) {
    const archive = StorageManager.getArchive();
    // Search backwards
    for (const item of archive) {
        if (item.details && item.details[exName]) {
            return {
                date: item.date,
                sets: item.details[exName].sets
            };
        }
    }
    return null;
}

function showConfirmScreen(forceExName = null) {
    let exName = forceExName;
    if (!exName) {
        if (variationMap[state.type] && variationMap[state.type][state.exIdx]) {
            showVariationSelect();
            return;
        }
        exName = workouts[state.type][state.exIdx];
    }
    
    const exData = exerciseDatabase.find(e => e.name === exName);
    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    document.getElementById('confirm-ex-name').innerText = exData.name;
    
    // Buttons visibility
    const intBtn = document.getElementById('btn-interruption');
    if (intBtn) intBtn.style.display = (state.exIdx > 0) ? 'block' : 'none';
    const swapBtn = document.getElementById('btn-swap-confirm');
    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption && !state.isArmPhase) {
        swapBtn.style.display = 'flex';
    } else {
        swapBtn.style.display = 'none';
    }

    // Render History Card
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = "";
    
    const history = getLastPerformance(exName);
    if (history) {
        const historyHtml = `
            <div class="glass-card compact" style="width:100%; box-sizing:border-box;">
                <div style="font-size:0.85em; color:var(--text-dim); margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
                    ביצוע אחרון: ${history.date}
                </div>
                <div class="history-list">
                    ${history.sets.map(s => `<div class="history-item">${s}</div>`).join('')}
                </div>
            </div>
        `;
        historyContainer.innerHTML = historyHtml;
    }

    navigate('ui-confirm');
}

function showVariationSelect() {
    const options = document.getElementById('variation-options');
    options.innerHTML = "";
    document.getElementById('variation-title').innerText = "בחר וריאציה";
    const possibleVariations = variationMap[state.type][state.exIdx];
    const available = possibleVariations.filter(name => !state.completedExInSession.includes(name));
    available.forEach(name => {
        const btn = document.createElement('button');
        btn.className = "menu-card";
        btn.innerHTML = `<span>${name}</span><div class="arrow">➔</div>`;
        btn.onclick = () => showConfirmScreen(name);
        options.appendChild(btn);
    });
    navigate('ui-variation');
}

function confirmExercise(doEx) {
    if (!doEx) { state.log.push({ skip: true, exName: state.currentExName }); state.completedExInSession.push(state.currentExName); checkFlow(); return; }
    if (state.currentEx.isCalc) setupCalculatedEx(); else startRecording();
}

function setupCalculatedEx() {
    document.getElementById('rm-title').innerText = `${state.currentExName} 1RM`;
    const lastRM = StorageManager.getLastRM(state.currentExName);
    const defaultRM = lastRM ? lastRM : state.currentEx.baseRM;
    const minRM = state.currentEx.rmRange[0];
    const maxRM = state.currentEx.rmRange[1];
    const p = document.getElementById('rm-picker'); p.innerHTML = "";
    for(let i = minRM; i <= maxRM; i += 2.5) {
        let o = new Option(i + " kg", i); if(i === defaultRM) o.selected = true; p.add(o);
    }
    navigate('ui-1rm');
}

function save1RM() {
    state.rm = parseFloat(document.getElementById('rm-picker').value);
    StorageManager.saveRM(state.currentExName, state.rm);
    let percentages = []; let reps = [];
    if (state.week === 1) { percentages = [0.65, 0.75, 0.85, 0.75, 0.65]; reps = [5, 5, 5, 8, 10]; } 
    else if (state.week === 2) { percentages = [0.70, 0.80, 0.90, 0.80, 0.70, 0.70]; reps = [3, 3, 3, 8, 10, 10]; } 
    else if (state.week === 3) { percentages = [0.75, 0.85, 0.95, 0.85, 0.75, 0.75]; reps = [5, 3, 1, 8, 10, 10]; }
    state.currentEx.sets = percentages.map((pct, i) => ({ w: Math.round((state.rm * pct) / 2.5) * 2.5, r: reps[i] }));
    startRecording();
}

function startRecording() { 
    state.setIdx = 0; 
    state.lastLoggedSet = null; 
    
    // Reset Inline UI
    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    
    navigate('ui-main'); 
    initPickers(); 
}

function initPickers() {
    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `SET ${state.setIdx + 1}/${state.currentEx.sets.length}`;
    document.getElementById('set-notes').value = '';
    const hist = document.getElementById('last-set-info');
    if (state.lastLoggedSet) {
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
        hist.style.display = 'block';
    } else hist.style.display = 'none';
    document.getElementById('unilateral-note').style.display = unilateralExercises.some(u => state.currentExName.includes(u)) ? 'block' : 'none';
    const btnWarmup = document.getElementById('btn-warmup');
    btnWarmup.style.display = (state.setIdx === 0 && heavyCompounds.includes(state.currentExName)) ? 'block' : 'none';
    
    // Timer Logic: Only show/start if not the first set. 
    // The "Extra Set" logic handles timer separately.
    const timerArea = document.getElementById('timer-area');
    if (state.setIdx > 0 && document.getElementById('action-panel').style.display === 'none') { 
        timerArea.style.visibility = 'visible'; 
        resetAndStartTimer(); 
    } else { 
        timerArea.style.visibility = 'hidden'; 
        stopRestTimer(); 
    }

    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    const step = state.currentEx.step || 2.5;
    const savedWeight = StorageManager.getLastWeight(state.currentExName);
    let defaultW; let currentR;
    if (state.currentEx.isCalc && target) { defaultW = target.w; currentR = target.r; } 
    else {
        defaultW = state.lastLoggedSet ? state.lastLoggedSet.w : (state.setIdx === 0 && savedWeight ? savedWeight : (target ? target.w : 0));
        currentR = state.lastLoggedSet ? state.lastLoggedSet.r : (target ? target.r : 8);
    }
    const minW = Math.max(0, defaultW - 40); const maxW = defaultW + 50;
    for(let i = minW; i <= maxW; i = parseFloat((i + step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === defaultW) o.selected = true; wPick.add(o);
    }
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    for(let i = 1; i <= 30; i++) { let o = new Option(i, i); if(i === currentR) o.selected = true; rPick.add(o); }
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "Fail" : v, v); if(v === 2) o.selected = true; rirPick.add(o);
    });
}

function calcWarmup() {
    const targetW = parseFloat(document.getElementById('weight-picker').value);
    const list = document.getElementById('warmup-list'); list.innerHTML = "";
    const percentages = [0, 0.4, 0.6, 0.8];
    percentages.forEach((pct, idx) => {
        let w; let reps;
        if(idx === 0) { w = 20; reps = 10; }
        else {
            w = Math.round((targetW * pct) / 2.5) * 2.5;
            if (w < 20) w = 20;
            reps = idx === 1 ? 5 : (idx === 2 ? 3 : 2);
        }
        if (w >= targetW) return;
        const row = document.createElement('div'); row.className = "warmup-row";
        row.innerHTML = `<span>סט ${idx + 1}</span><span>${w}kg x ${reps}</span>`;
        list.appendChild(row);
    });
    document.getElementById('warmup-modal').style.display = 'flex';
}

function closeWarmup() { document.getElementById('warmup-modal').style.display = 'none'; }
function markWarmupDone() { state.log.push({ exName: state.currentExName, isWarmup: true }); closeWarmup(); }

function openSwapMenu() {
    const swapList = document.getElementById('swap-options'); swapList.innerHTML = "";
    const workoutList = workouts[state.type]; if (!workoutList) return;
    const remaining = workoutList.filter(ex => !state.completedExInSession.includes(ex) && ex !== state.currentExName);
    if (remaining.length === 0) { swapList.innerHTML = "<p style='text-align:center; color:gray;'>אין תרגילים נוספים להחלפה</p>"; }
    remaining.forEach(exName => {
        const btn = document.createElement('button'); btn.className = "menu-card"; btn.innerHTML = `<span>${exName}</span><div class="arrow">➔</div>`;
        btn.onclick = () => { state.exIdx = workouts[state.type].indexOf(exName); showConfirmScreen(); };
        swapList.appendChild(btn);
    });
    navigate('ui-swap-list');
}

function resetAndStartTimer() {
    stopRestTimer(); state.seconds = 0; state.startTime = Date.now();
    const target = (state.exIdx === 0 && !state.isArmPhase && !state.isFreestyle && !state.isExtraPhase && !state.isInterruption) ? 120 : 90;
    const circle = document.getElementById('timer-progress'); const text = document.getElementById('rest-timer');
    text.innerText = "00:00"; circle.style.strokeDashoffset = 283;
    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        state.seconds = elapsed;
        const mins = Math.floor(state.seconds / 60).toString().padStart(2, '0');
        const secs = (state.seconds % 60).toString().padStart(2, '0');
        text.innerText = `${mins}:${secs}`;
        const progress = Math.min(state.seconds / target, 1);
        circle.style.strokeDashoffset = 283 - (progress * 283);
        if (state.seconds === target) playBeep(2);
    }, 100); 
}

function stopRestTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

function getNextExerciseName() {
    // Logic to peek at the next exercise name for the passive preview
    if (state.isInterruption) return "חזרה למסלול המקורי";
    if (state.isExtraPhase) return "בחירת תרגיל נוסף";
    if (state.isArmPhase) return "תרגיל ידיים הבא / סיום";

    const workoutList = workouts[state.type];
    if (!workoutList) return "סיום אימון";

    // Try to find the next available slot
    for (let i = 0; i < workoutList.length; i++) {
        const defaultName = workoutList[i];
        let isDone = state.completedExInSession.includes(defaultName);
        
        if (!isDone && variationMap[state.type] && variationMap[state.type][i]) {
            const variations = variationMap[state.type][i];
            if (variations.some(v => state.completedExInSession.includes(v))) {
                isDone = true;
            }
        }

        // If we found a slot that is NOT done, and it's not the current one we are doing
        if (!isDone && defaultName !== state.currentExName && !state.completedExInSession.includes(state.currentExName)) {
             // Basic check: if we are at index X, next is usually X+1
             if (i > state.exIdx) return defaultName; 
        }
    }
    
    // Fallback logic for simplicity
    if (state.exIdx < workoutList.length - 1) {
         return workoutList[state.exIdx + 1];
    }

    return "סיום אימון / תוספות";
}

function nextStep() {
    haptic('light');
    const wVal = parseFloat(document.getElementById('weight-picker').value);
    const noteVal = document.getElementById('set-notes').value.trim();
    const entry = { exName: state.currentExName, w: wVal, r: parseInt(document.getElementById('reps-picker').value), rir: document.getElementById('rir-picker').value, note: noteVal };
    StorageManager.saveWeight(state.currentExName, wVal);
    state.log.push(entry); state.lastLoggedSet = entry;

    // Check if this was the last set
    if (state.setIdx < state.currentEx.sets.length - 1) { 
        state.setIdx++; 
        initPickers(); 
    } else { 
        haptic('medium'); 
        // Inline Finish Flow
        document.getElementById('btn-submit-set').style.display = 'none';
        document.getElementById('action-panel').style.display = 'block';
        
        // Passive Preview
        const nextName = getNextExerciseName();
        document.getElementById('next-ex-preview').innerText = `הבא בתור: ${nextName}`;

        // Stop timer (it will restart only if extra set is chosen)
        stopRestTimer();
        document.getElementById('timer-area').style.visibility = 'hidden';
    }
}

function addExtraSet() {
    state.setIdx++;
    // Add a copy of the last set configuration to the array
    state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]});
    
    // UI Reset
    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    
    initPickers();
    // Force start timer for the extra set rest
    document.getElementById('timer-area').style.visibility = 'visible'; 
    resetAndStartTimer();
}

function finishCurrentExercise() {
    // Commit exercise: prune stack to keep history clean
    state.historyStack = state.historyStack.filter(s => s !== 'ui-main');
    
    if (!state.completedExInSession.includes(state.currentExName)) state.completedExInSession.push(state.currentExName);
    
    if (state.isInterruption) { state.isInterruption = false; navigate('ui-confirm'); } 
    else if (state.isExtraPhase) { navigate('ui-ask-extra'); } 
    else if (state.isArmPhase) { showArmSelection(); } 
    else if (state.isFreestyle) { showExerciseList(state.currentMuscle); } 
    else { checkFlow(); }
}

function checkFlow() {
    const workoutList = workouts[state.type];
    let foundNext = false;

    for (let i = 0; i < workoutList.length; i++) {
        const defaultName = workoutList[i];
        let isDone = state.completedExInSession.includes(defaultName);

        // If default isn't done, check if any variation of this slot is done
        if (!isDone && variationMap[state.type] && variationMap[state.type][i]) {
            const variations = variationMap[state.type][i];
            if (variations.some(v => state.completedExInSession.includes(v))) {
                isDone = true;
            }
        }

        if (!isDone) {
            state.exIdx = i;
            showConfirmScreen();
            foundNext = true;
            break;
        }
    }

    if (!foundNext) {
        navigate('ui-ask-extra');
    }
}

function interruptWorkout() {
    state.isInterruption = true;
    document.getElementById('btn-resume-flow').style.display = 'flex';
    document.getElementById('btn-finish-extra').style.display = 'none';
    navigate('ui-muscle-select');
}

function resumeWorkout() { state.isInterruption = false; navigate('ui-confirm'); }
function startExtraPhase() { state.isExtraPhase = true; document.getElementById('btn-resume-flow').style.display = 'none'; document.getElementById('btn-finish-extra').style.display = 'block'; navigate('ui-muscle-select'); }
function finishExtraPhase() { navigate('ui-ask-arms'); }

function startArmWorkout() { 
    state.isArmPhase = true; 
    document.getElementById('arm-selection-title').innerText = "מה להתחיל?";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    const btnBi = document.createElement('button'); btnBi.className = "menu-card"; btnBi.innerHTML = `<span>יד קדמית (Biceps)</span><div class="arrow">➔</div>`;
    btnBi.onclick = () => { state.armGroup = 'biceps'; state.firstArmGroup = 'biceps'; state.secondArmGroup = 'triceps'; showArmSelection(); };
    const btnTri = document.createElement('button'); btnTri.className = "menu-card"; btnTri.innerHTML = `<span>יד אחורית (Triceps)</span><div class="arrow">➔</div>`;
    btnTri.onclick = () => { state.armGroup = 'triceps'; state.firstArmGroup = 'triceps'; state.secondArmGroup = 'biceps'; showArmSelection(); };
    opts.appendChild(btnBi); opts.appendChild(btnTri);
    document.getElementById('btn-skip-arm-group').style.display = 'none';
    navigate('ui-arm-selection');
}

function showArmSelection() {
    const list = armExercises[state.armGroup];
    const remaining = list.filter(ex => !state.completedExInSession.includes(ex.name));
    if (remaining.length === 0) {
        if (state.armGroup === state.firstArmGroup) { state.armGroup = state.secondArmGroup; showArmSelection(); } 
        else { finish(); }
        return;
    }
    const isBiceps = state.armGroup === 'biceps';
    document.getElementById('arm-selection-title').innerText = isBiceps ? "בחר בייספס" : "בחר טרייספס";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    remaining.forEach(ex => {
        const btn = document.createElement('button'); btn.className = "menu-card"; btn.innerText = ex.name;
        btn.onclick = () => { state.currentEx = JSON.parse(JSON.stringify(ex)); state.currentExName = ex.name; state.currentEx.sets = [ex.sets[0], ex.sets[0], ex.sets[0]]; startRecording(); };
        opts.appendChild(btn);
    });
    const skipBtn = document.getElementById('btn-skip-arm-group'); skipBtn.style.display = 'block';
    if (state.armGroup === state.firstArmGroup) {
        skipBtn.innerText = isBiceps ? "דלג לטרייספס" : "דלג לבייספס";
        skipBtn.onclick = () => { state.armGroup = state.secondArmGroup; showArmSelection(); };
    } else {
        skipBtn.innerText = "סיים אימון"; skipBtn.onclick = () => finish();
    }
    navigate('ui-arm-selection');
}

function finish() {
    haptic('success');
    state.workoutDurationMins = Math.floor((Date.now() - state.workoutStartTime) / 60000);
    navigate('ui-summary');
    
    // Clear note input for fresh entry
    document.getElementById('summary-note').value = "";
    
    const workoutDisplayName = workoutNames[state.type] || state.type;
    const dateStr = new Date().toLocaleDateString('he-IL');
    let summaryText = `GYMPRO ELITE SUMMARY\n${workoutDisplayName} | ${dateStr} | ${state.workoutDurationMins}m\n\n`;
    let grouped = {};
    
    state.log.forEach(e => {
        if (!grouped[e.exName]) grouped[e.exName] = { sets: [], vol: 0, hasWarmup: false };
        if (e.isWarmup) grouped[e.exName].hasWarmup = true;
        else if (!e.skip) {
            let weightStr = `${e.w}kg`;
            if (unilateralExercises.some(u => e.exName.includes(u))) {
                weightStr += ` (יד אחת)`;
            }

            let setStr = `${weightStr} x ${e.r} (RIR ${e.rir})`;
            if (e.note) setStr += ` | Note: ${e.note}`;
            grouped[e.exName].sets.push(setStr); grouped[e.exName].vol += (e.w * e.r);
        }
    });

    for (let ex in grouped) { 
        summaryText += `${ex} (Vol: ${grouped[ex].vol}kg):\n`;
        if (grouped[ex].hasWarmup) summaryText += `🔥 Warmup Completed\n`;
        summaryText += `${grouped[ex].sets.join('\n')}\n\n`; 
    }
    
    document.getElementById('summary-area').innerText = summaryText.trim();
    
    // Store details for save later
    state.lastWorkoutDetails = grouped;
}

function copyResult() {
    // 1. Get base text
    let text = document.getElementById('summary-area').innerText;
    
    // 2. Get optional note
    const userNote = document.getElementById('summary-note').value.trim();
    if (userNote) {
        text += `\n\n📝 הערות כלליות: ${userNote}`;
    }

    // 3. Prepare Archive Object
    const workoutDisplayName = workoutNames[state.type] || state.type;
    const dateStr = new Date().toLocaleDateString('he-IL');
    
    const archiveObj = { 
        id: Date.now(), 
        date: dateStr, 
        timestamp: Date.now(), 
        type: workoutDisplayName, 
        duration: state.workoutDurationMins, 
        summary: text, 
        details: state.lastWorkoutDetails,
        generalNote: userNote // Save note specifically as well
    };

    // 4. Save to Archive
    StorageManager.saveToArchive(archiveObj);

    // 5. Copy & Close
    if (navigator.clipboard) { 
        navigator.clipboard.writeText(text).then(() => { 
            haptic('light'); 
            alert("הסיכום (כולל הערות) הועתק ונשמר בארכיון!"); 
            location.reload(); 
        }); 
    } else { 
        const el = document.createElement("textarea"); 
        el.value = text; 
        document.body.appendChild(el); 
        el.select(); 
        document.execCommand('copy'); 
        document.body.removeChild(el); 
        alert("הסיכום (כולל הערות) הועתק ונשמר בארכיון!"); 
        location.reload(); 
    }
}

// --- ARCHIVE LOGIC & CALENDAR ---

function switchArchiveView(view) {
    state.archiveView = view;
    document.getElementById('btn-view-list').className = `segment-btn ${view === 'list' ? 'active' : ''}`;
    document.getElementById('btn-view-calendar').className = `segment-btn ${view === 'calendar' ? 'active' : ''}`;
    openArchive();
}

function openArchive() {
    if (state.archiveView === 'list') {
        document.getElementById('list-view-container').style.display = 'block';
        document.getElementById('calendar-view').style.display = 'none';
        renderArchiveList();
    } else {
        document.getElementById('list-view-container').style.display = 'none';
        document.getElementById('calendar-view').style.display = 'block';
        state.calendarOffset = 0;
        renderCalendar();
    }
    navigate('ui-archive');
}

// --- LIST VIEW LOGIC ---
function renderArchiveList() {
    const list = document.getElementById('archive-list'); list.innerHTML = "";
    selectedArchiveIds.clear(); updateCopySelectedBtn();
    const history = StorageManager.getArchive();
    if (history.length === 0) { list.innerHTML = `<div style="text-align:center; color:gray; margin-top:20px;">אין אימונים שמורים</div>`; } 
    else {
        history.forEach(item => {
            const card = document.createElement('div'); card.className = "menu-card"; card.style.cursor = "default";
            card.innerHTML = `<div class="archive-card-row"><input type="checkbox" class="archive-checkbox" data-id="${item.timestamp}"><div class="archive-info"><div style="display:flex; justify-content:space-between; width:100%;"><h3 style="margin:0;">${item.date}</h3><span style="font-size:0.8em; color:#8E8E93">${item.duration} דק'</span></div><p style="margin:0; color:#8E8E93; font-size:0.85em;">${item.type}</p></div><div class="arrow">➔</div></div>`;
            const checkbox = card.querySelector('.archive-checkbox');
            checkbox.addEventListener('change', (e) => toggleArchiveSelection(parseInt(e.target.dataset.id)));
            checkbox.addEventListener('click', (e) => e.stopPropagation());
            card.addEventListener('click', (e) => { if (e.target !== checkbox) showArchiveDetail(item); });
            list.appendChild(card);
        });
    }
}

function toggleArchiveSelection(id) { if (selectedArchiveIds.has(id)) selectedArchiveIds.delete(id); else selectedArchiveIds.add(id); updateCopySelectedBtn(); }

function updateCopySelectedBtn() {
    const btn = document.getElementById('btn-copy-selected');
    if (selectedArchiveIds.size > 0) { btn.disabled = false; btn.style.opacity = "1"; btn.style.borderColor = "var(--accent)"; btn.style.color = "var(--accent)"; } 
    else { btn.disabled = true; btn.style.opacity = "0.5"; btn.style.borderColor = "var(--border)"; btn.style.color = "var(--text-dim)"; }
}

function copyBulkLog(mode) {
    const history = StorageManager.getArchive();
    let itemsToCopy = mode === 'all' ? history : history.filter(item => selectedArchiveIds.has(item.timestamp));
    if (itemsToCopy.length === 0) { alert("לא נבחרו אימונים להעתקה"); return; }
    const bulkText = itemsToCopy.map(item => item.summary).join("\n\n========================================\n\n");
    if (navigator.clipboard) { navigator.clipboard.writeText(bulkText).then(() => { haptic('success'); alert(`הועתקו ${itemsToCopy.length} אימונים בהצלחה!`); }); } 
    else { const el = document.createElement("textarea"); el.value = bulkText; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); alert(`הועתקו ${itemsToCopy.length} אימונים בהצלחה!`); }
}

// --- CALENDAR VIEW LOGIC ---
function changeMonth(delta) {
    state.calendarOffset += delta;
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = "";
    
    // Calculate dates
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + state.calendarOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // Set Header
    const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    document.getElementById('current-month-display').innerText = `${monthNames[month]} ${year}`;
    
    // Grid logic
    const firstDayIndex = targetDate.getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Retrieve data
    const history = StorageManager.getArchive();
    const monthWorkouts = history.filter(item => {
        const d = new Date(item.timestamp);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    // Render Empty Cells
    for(let i = 0; i < firstDayIndex; i++) {
        const cell = document.createElement('div');
        cell.className = "calendar-cell empty";
        grid.appendChild(cell);
    }

    // Render Days
    const today = new Date();
    for(let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = "calendar-cell";
        cell.innerHTML = `<span>${day}</span>`;
        
        // Highlight today
        if(state.calendarOffset === 0 && day === today.getDate()) {
            cell.classList.add('today');
        }

        // Find workouts for this day
        const dailyWorkouts = monthWorkouts.filter(item => new Date(item.timestamp).getDate() === day);
        if(dailyWorkouts.length > 0) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = "dots-container";
            dailyWorkouts.forEach(wo => {
                const dot = document.createElement('div');
                let dotClass = 'type-free';
                if(wo.type.includes('A')) dotClass = 'type-a';
                else if(wo.type.includes('B')) dotClass = 'type-b';
                else if(wo.type.includes('C')) dotClass = 'type-c';
                dot.className = `dot ${dotClass}`;
                dotsContainer.appendChild(dot);
            });
            cell.appendChild(dotsContainer);
            cell.onclick = () => openDayDrawer(dailyWorkouts, day, monthNames[month]);
        }
        grid.appendChild(cell);
    }
}

// --- BOTTOM SHEET DRAWER ---
function openDayDrawer(workouts, day, monthName) {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    const content = document.getElementById('sheet-content');
    
    let html = `<h3>${day} ב${monthName}</h3>`;
    if(workouts.length === 0) {
        html += `<p>אין אימונים ביום זה</p>`;
    } else {
        html += `<p>נמצאו ${workouts.length} אימונים:</p>`;
        workouts.forEach(wo => {
            let dotColor = '#BF5AF2';
            if(wo.type.includes('A')) dotColor = '#0A84FF';
            else if(wo.type.includes('B')) dotColor = '#32D74B';
            else if(wo.type.includes('C')) dotColor = '#FF9F0A';
            
            html += `
            <div class="mini-workout-item" onclick='openArchiveFromDrawer(${JSON.stringify(wo).replace(/'/g, "&#39;")})'>
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.95em;">${wo.type}</div>
                    <div style="font-size:0.8em; color:#8E8E93;">${wo.duration} דק' • ${new Date(wo.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="arrow">➔</div>
            </div>`;
        });
    }
    
    content.innerHTML = html;
    overlay.style.display = 'block';
    drawer.classList.add('open');
    haptic('light');
}

function closeDayDrawer() {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    drawer.classList.remove('open');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function openArchiveFromDrawer(itemData) {
    closeDayDrawer();
    // Re-finding item by timestamp is safer.
    const realItem = StorageManager.getArchive().find(i => i.timestamp === itemData.timestamp);
    if(realItem) showArchiveDetail(realItem);
}

function showArchiveDetail(item) {
    currentArchiveItem = item; document.getElementById('archive-detail-content').innerText = item.summary;
    document.getElementById('btn-archive-copy').onclick = () => navigator.clipboard.writeText(item.summary).then(() => alert("הועתק!"));
    document.getElementById('btn-archive-delete').onclick = () => { if(confirm("למחוק אימון זה מהארכיון?")) { StorageManager.deleteFromArchive(item.timestamp); openArchive(); } };
    navigate('ui-archive-detail');
}

function exportData() {
    const data = StorageManager.getAllData();
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"})); a.download = `gympro_backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function triggerImport() { document.getElementById('import-file').click(); }
function importData(input) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(confirm("האם לדרוס את הנתונים הקיימים ולשחזר מהגיבוי?")) { StorageManager.restoreData(data); alert("הנתונים שוחזרו בהצלחה! האפליקציה תרענן את עצמה."); location.reload(); }
        } catch(err) { alert("שגיאה בטעינת הקובץ. וודא שזהו קובץ גיבוי תקין."); }
    };
    reader.readAsText(file);
}

// --- NEW SESSION DRAWER LOGIC ---

function openSessionLog() {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    const content = document.getElementById('sheet-content');

    let html = `<h3>יומן אימון נוכחי</h3>`;
    
    if (state.log.length === 0) {
        html += `<p style="text-align:center; margin-top:20px;">טרם בוצעו סטים באימון זה</p>`;
    } else {
        html += `<div class="vertical-stack">`;
        state.log.forEach((entry, index) => {
            const isSkip = entry.skip;
            const isWarmup = entry.isWarmup;
            let displayTitle = entry.exName;
            let details = "";
            let dotColor = "var(--text-dim)";

            if (isSkip) {
                details = "דילוג על תרגיל";
            } else if (isWarmup) {
                details = "סט חימום";
                dotColor = "#ff3b30";
            } else {
                details = `${entry.w}kg x ${entry.r} (RIR ${entry.rir})`;
                if (entry.note) details += ` | 📝`;
                dotColor = "var(--accent)";
            }

            html += `
            <div class="mini-workout-item" onclick="openEditSet(${index})">
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.9em;">${index + 1}. ${displayTitle}</div>
                    <div style="font-size:0.85em; color:#8E8E93;">${details}</div>
                </div>
                <div class="arrow">✎</div>
            </div>`;
        });
        html += `</div>`;
    }

    content.innerHTML = html;
    overlay.style.display = 'block';
    drawer.classList.add('open');
    haptic('light');
}

function openEditSet(index) {
    const entry = state.log[index];
    if (entry.skip || entry.isWarmup) {
        alert("לא ניתן לערוך דילוגים או סטים של חימום כרגע.");
        return;
    }

    state.editingIndex = index;
    document.getElementById('edit-weight').value = entry.w;
    document.getElementById('edit-reps').value = entry.r;
    document.getElementById('edit-rir').value = entry.rir;
    document.getElementById('edit-note').value = entry.note || "";

    // Show delete only if it's the very last set
    const btnDelete = document.getElementById('btn-delete-last-set');
    if (index === state.log.length - 1) {
        btnDelete.style.display = 'block';
    } else {
        btnDelete.style.display = 'none';
    }

    // Hide drawer, show modal
    closeDayDrawer(); // repurposing the close function for the sheet
    document.getElementById('edit-set-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-set-modal').style.display = 'none';
    state.editingIndex = -1;
}

function saveSetEdit() {
    if (state.editingIndex === -1) return;
    
    const w = parseFloat(document.getElementById('edit-weight').value);
    const r = parseInt(document.getElementById('edit-reps').value);
    const rir = document.getElementById('edit-rir').value;
    const note = document.getElementById('edit-note').value;

    if (isNaN(w) || isNaN(r)) {
        alert("נא להזין ערכים תקינים");
        return;
    }

    // Update Log
    state.log[state.editingIndex].w = w;
    state.log[state.editingIndex].r = r;
    state.log[state.editingIndex].rir = rir;
    state.log[state.editingIndex].note = note;

    // Update Last Logged Set if we edited the last one
    if (state.editingIndex === state.log.length - 1) {
        state.lastLoggedSet = state.log[state.editingIndex];
        // Refresh UI info pill
        const hist = document.getElementById('last-set-info');
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
    }

    closeEditModal();
    haptic('success');
    openSessionLog(); // Re-open the drawer to show changes
}

function deleteLastSet() {
    if (confirm("האם למחוק את הסט האחרון? פעולה זו תחזיר אותך צעד אחד אחורה.")) {
        state.log.pop();
        state.lastLoggedSet = state.log.length > 0 ? state.log[state.log.length - 1] : null;
        
        // Restore UI if we were in "Done" state
        if (document.getElementById('action-panel').style.display === 'block') {
             document.getElementById('action-panel').style.display = 'none';
             document.getElementById('btn-submit-set').style.display = 'block';
        } else if (state.setIdx > 0) {
            state.setIdx--;
        }
        
        closeEditModal();
        haptic('warning');
        initPickers(); // Refresh the main screen UI
    }
}
