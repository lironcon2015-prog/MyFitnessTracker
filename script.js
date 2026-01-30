/**
 * GYMPRO ELITE V12.5.2
 * - Feature: Auto-Recovery System (Session Persistence).
 * - Fix: 1RM Calculated exercises now prioritize planned reps over last set history.
 * - UI: Settings button visible only on Home Screen.
 * - Feature: Restored "Add" button logic in Confirm Screen (Interruption).
 * - UI: Updated Confirm Screen Layout (Fixed Top, 3-Col Grid).
 * - Logic: Improved Cluster Finish Flow (Main button becomes "Finish").
 * - Data: Added "Arnold" and "Raises" to Unilateral detection.
 */

// --- DEFAULT DATA (Factory Settings) ---
const defaultExercises = [
    // SHOULDERS (כתפיים)
    { name: "Overhead Press (Main)", muscles: ["כתפיים"], isCalc: true, baseRM: 60, rmRange: [50, 100], manualRange: {base: 50, min: 40, max: 80, step: 2.5} },
    { name: "Arnold Press", muscles: ["כתפיים"], sets: [{w: 15, r: 10}, {w: 15, r: 10}, {w: 15, r: 10}], step: 2.5 },
    { name: "Dumbbell Shoulder Press", muscles: ["כתפיים"], sets: [{w: 20, r: 10}, {w: 20, r: 10}, {w: 20, r: 10}], step: 2.5 },
    { name: "Machine Press", muscles: ["כתפיים"], sets: [{w: 40, r: 10}, {w: 40, r: 10}, {w: 40, r: 10}], step: 5 },
    { name: "Lateral Raises", muscles: ["כתפיים"], sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
    { name: "Cable Lateral Raises", muscles: ["כתפיים"], sets: [{w: 5, r: 15}, {w: 5, r: 15}, {w: 5, r: 15}], step: 1.25 },
    { name: "Face Pulls", muscles: ["כתפיים"], sets: [{w: 40, r: 13}, {w: 40, r: 13}, {w: 40, r: 15}], step: 2.5 },
    { name: "Rear Delt Fly (Dumbbells)", muscles: ["כתפיים"], sets: [{w: 10, r: 15}, {w: 10, r: 15}, {w: 10, r: 15}], step: 1 },
    { name: "Barbell Shrugs", muscles: ["כתפיים"], sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
    { name: "Front Raises", muscles: ["כתפיים"], sets: [{w: 10, r: 12}, {w: 10, r: 12}, {w: 10, r: 12}], step: 1 },

    // NEW EXERCISES
    { name: "Y Raises", muscles: ["גב", "כתפיים"], sets: [{w: 4, r: 12}, {w: 4, r: 12}, {w: 4, r: 12}], step: 1 },
    { name: "L Raises", muscles: ["גב", "כתפיים"], sets: [{w: 3, r: 12}, {w: 3, r: 12}, {w: 3, r: 12}], step: 1 },

    // BACK (גב)
    { name: "Weighted Pull Ups", muscles: ["גב", "קליסטניקס"], sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60, isBW: true },
    { name: "Pull Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Chin Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Wide Grip Pull Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 },
    { name: "Cable Row", muscles: ["גב"], sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 },
    { name: "Machine Row", muscles: ["גב"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 },
    { name: "Straight Arm Pulldown", muscles: ["גב"], sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Back Extension", muscles: ["גב"], sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}], step: 5, minW: 0, maxW: 50, isBW: true },
    { name: "T-Bar Row", muscles: ["גב"], sets: [{w: 40, r: 10}, {w: 40, r: 10}, {w: 40, r: 10}], step: 5 },
    { name: "Single Arm Dumbbell Row", muscles: ["גב"], sets: [{w: 25, r: 10}, {w: 25, r: 10}, {w: 25, r: 10}], step: 2.5 },
    { name: "Rack Pulls", muscles: ["גב"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 5 },
    { name: "Reverse Fly (Machine)", muscles: ["גב", "כתפיים"], sets: [{w: 30, r: 12}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Bodyweight Rows", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] },

    // CHEST (חזה)
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, rmRange: [80, 150], manualRange: {base: 85, min: 60, max: 140, step: 2.5} },
    { name: "Incline Bench Press", muscles: ["חזה"], sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
    { name: "Dumbbell Peck Fly", muscles: ["חזה"], sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
    { name: "Machine Peck Fly", muscles: ["חזה"], sets: [{w: 45, r: 11}, {w: 45, r: 11}, {w: 45, r: 11}], step: 1 },
    { name: "Cable Fly", muscles: ["חזה"], sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 },
    { name: "Dips", muscles: ["חזה", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] },
    { name: "Decline Bench Press", muscles: ["חזה"], sets: [{w: 80, r: 8}, {w: 80, r: 8}, {w: 80, r: 8}], step: 2.5 },
    { name: "Dumbbell Bench Press", muscles: ["חזה"], sets: [{w: 30, r: 8}, {w: 30, r: 8}, {w: 30, r: 8}], step: 2.5 },
    { name: "Incline Dumbbell Bench Press", muscles: ["חזה"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 2.5 },

    // LEGS (רגליים)
    { name: "Leg Press", muscles: ["רגליים", "quads"], sets: [{w: 280, r: 8}, {w: 300, r: 8}, {w: 300, r: 7}], step: 5 },
    { name: "Squat", muscles: ["רגליים", "quads", "glutes"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Deadlift", muscles: ["רגליים", "hamstrings"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Romanian Deadlift", muscles: ["רגליים", "hamstrings"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Sumo Deadlift", muscles: ["רגליים", "hamstrings", "glutes"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 2.5 },
    { name: "Single Leg Curl", muscles: ["רגליים", "hamstrings"], sets: [{w: 25, r: 8}, {w: 30, r: 6}, {w: 25, r: 8}], step: 2.5 },
    { name: "Lying Leg Curl (Double)", muscles: ["רגליים", "hamstrings"], sets: [{w: 50, r: 8}, {w: 60, r: 6}, {w: 50, r: 8}], step: 5 },
    { name: "Seated Leg Curl", muscles: ["רגליים", "hamstrings"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 10}], step: 5 }, 
    { name: "Seated Calf Raise", muscles: ["רגליים", "calves"], sets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 12}], step: 5 },
    { name: "Standing Calf Raise", muscles: ["רגליים", "calves"], sets: [{w: 110, r: 10}, {w: 110, r: 10}, {w: 110, r: 12}], step: 10 },
    { name: "Bulgarian Split Squat", muscles: ["רגליים", "quads", "glutes"], sets: [{w: 10, r: 8}, {w: 10, r: 8}, {w: 10, r: 8}], step: 2.5 },
    { name: "Walking Lunges", muscles: ["רגליים", "quads", "glutes"], sets: [{w: 10, r: 10}, {w: 10, r: 10}, {w: 10, r: 10}], step: 1 },
    { name: "Hack Squat", muscles: ["רגליים", "quads"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 10}], step: 5 },
    { name: "Hip Thrust", muscles: ["רגליים", "glutes"], sets: [{w: 60, r: 10}, {w: 60, r: 10}, {w: 60, r: 10}], step: 5 },

    // ARMS (ידיים)
    { name: "Dumbbell Bicep Curls", muscles: ["ידיים", "biceps"], sets: [{w: 12, r: 8}, {w: 12, r: 8}, {w: 12, r: 8}], step: 0.5 },
    { name: "Barbell Bicep Curls", muscles: ["ידיים", "biceps"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 1 },
    { name: "Concentration Curls", muscles: ["ידיים", "biceps"], sets: [{w: 10, r: 10}, {w: 10, r: 10}, {w: 10, r: 10}], step: 0.5 },
    { name: "Hammer Curls", muscles: ["ידיים", "biceps"], sets: [{w: 12, r: 10}, {w: 12, r: 10}, {w: 12, r: 10}], step: 1 },
    { name: "Preacher Curls", muscles: ["ידיים", "biceps"], sets: [{w: 20, r: 10}, {w: 20, r: 10}, {w: 20, r: 10}], step: 1 },
    { name: "Reverse Grip Curl", muscles: ["ידיים", "biceps"], sets: [{w: 15, r: 10}, {w: 15, r: 10}, {w: 15, r: 10}], step: 1 },
    
    { name: "Triceps Pushdown", muscles: ["ידיים", "triceps"], sets: [{w: 35, r: 8}, {w: 35, r: 8}, {w: 35, r: 8}], step: 2.5 },
    { name: "Skullcrushers", muscles: ["ידיים", "triceps"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 2.5 },
    { name: "Overhead Triceps Extension (Cable)", muscles: ["ידיים", "triceps"], sets: [{w: 15, r: 12}, {w: 15, r: 12}, {w: 15, r: 12}], step: 1.25 },

    // CALISTHENICS
    { name: "Muscle Up", muscles: ["קליסטניקס"], isBW: true, sets: [{w: 0, r: 3}, {w: 0, r: 3}, {w: 0, r: 3}] },
    { name: "Pistol Squat", muscles: ["קליסטניקס", "רגליים", "quads"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Handstand Pushups", muscles: ["קליסטניקס", "כתפיים"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Front Lever", muscles: ["קליסטניקס", "גב"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Diamond Pushups", muscles: ["קליסטניקס", "חזה", "ידיים", "triceps"], isBW: true, sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}] },
    { name: "L-Sit", muscles: ["קליסטניקס", "בטן"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] }
];

const defaultWorkouts = {
    'כתפיים - גב - חזה': [
        { name: "Overhead Press (Main)", isMain: true, sets: 0 },
        { name: "Barbell Shrugs", isMain: false, sets: 3 },
        { name: "Lateral Raises", isMain: false, sets: 3 },
        { name: "Weighted Pull Ups", isMain: false, sets: 3 },
        { name: "Face Pulls", isMain: false, sets: 3 },
        { name: "Incline Bench Press", isMain: false, sets: 3 }
    ],
    'רגליים - גב': [
        { name: "Leg Press", isMain: false, sets: 3 },
        { name: "Single Leg Curl", isMain: false, sets: 3 },
        { name: "Lat Pulldown", isMain: false, sets: 3 },
        { name: "Cable Row", isMain: false, sets: 3 },
        { name: "Seated Calf Raise", isMain: false, sets: 3 },
        { name: "Straight Arm Pulldown", isMain: false, sets: 3 }
    ],
    'חזה - כתפיים': [
        { name: "Bench Press (Main)", isMain: true, sets: 0 },
        { name: "Incline Bench Press", isMain: false, sets: 3 },
        { name: "Dumbbell Peck Fly", isMain: false, sets: 3 },
        { name: "Lateral Raises", isMain: false, sets: 3 },
        { name: "Face Pulls", isMain: false, sets: 3 }
    ]
};

// --- SUBSTITUTION LOGIC ---
const substituteGroups = [
    ["Incline Bench Press", "Incline Dumbbell Bench Press"],
    ["Dumbbell Bench Press", "Machine Press"], 
    ["Dumbbell Peck Fly", "Machine Peck Fly", "Cable Fly"],
    ["Weighted Pull Ups", "Pull Ups", "Chin Ups", "Wide Grip Pull Ups", "Lat Pulldown"],
    ["Cable Row", "Machine Row", "T-Bar Row", "Single Arm Dumbbell Row", "Bodyweight Rows"],
    ["Straight Arm Pulldown", "Weighted Pull Ups"], 
    ["Dumbbell Shoulder Press", "Arnold Press", "Machine Press"],
    ["Lateral Raises", "Cable Lateral Raises"],
    ["Face Pulls", "Rear Delt Fly (Dumbbells)", "Reverse Fly (Machine)"],
    ["Single Leg Curl", "Lying Leg Curl (Double)", "Seated Leg Curl"],
    ["Seated Calf Raise", "Standing Calf Raise"],
    ["Leg Press", "Hack Squat", "Bulgarian Split Squat", "Walking Lunges"],
    ["Dumbbell Bicep Curls", "Barbell Bicep Curls", "Concentration Curls", "Hammer Curls", "Preacher Curls", "Reverse Grip Curl"],
    ["Triceps Pushdown", "Skullcrushers", "Overhead Triceps Extension (Cable)", "Diamond Pushups"]
];

function getSubstitutes(exName) {
    const group = substituteGroups.find(g => g.includes(exName));
    return group ? group.filter(n => n !== exName) : [];
}

function isExOrVariationDone(originalName) {
    if (state.completedExInSession.includes(originalName)) return true;
    const group = substituteGroups.find(g => g.includes(originalName));
    if (group) {
        return group.some(varName => state.completedExInSession.includes(varName));
    }
    return false;
}

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
    lastWorkoutDetails: {},
    archiveView: 'list',
    calendarOffset: 0,
    editingIndex: -1,
    freestyleFilter: 'all',
    exercises: [],
    workouts: {},
    
    // Cluster State
    clusterMode: false,
    activeCluster: null,
    clusterIdx: 0, 
    clusterRound: 1,
    lastClusterRest: 0 // To carry over rest time
};

let managerState = {
    originalName: '',
    currentName: '',
    exercises: [],
    selectorFilter: 'all',
    activeClusterRef: null,
    editingTimerEx: null 
};

const unilateralKeywords = [
    "Dumbbell", "Cable Lateral", "Single", "Concentration", "Hammer", "Pistol", "Walking Lunges", "Bulgarian", "Kickback", "One Arm", "Arnold", "Raises"
];

let audioContext;
let wakeLock = null;
let currentArchiveItem = null;
let selectedArchiveIds = new Set(); 

// --- LOCAL STORAGE MANAGER ---
const StorageManager = {
    KEY_WEIGHTS: 'gympro_weights',
    KEY_RM: 'gympro_rm',
    KEY_ARCHIVE: 'gympro_archive',
    KEY_DB_EXERCISES: 'gympro_db_exercises',
    KEY_DB_WORKOUTS: 'gympro_db_workouts',
    KEY_SESSION: 'gympro_current_session', // NEW KEY for Auto-Recovery

    getData(key) {
        try { return JSON.parse(localStorage.getItem(key)); } 
        catch { return null; }
    },

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    initDB() {
        const storedEx = this.getData(this.KEY_DB_EXERCISES);
        const storedWo = this.getData(this.KEY_DB_WORKOUTS);

        if (storedEx && storedEx.length > 0) {
            state.exercises = storedEx;
            const missing = defaultExercises.filter(def => !state.exercises.find(e => e.name === def.name));
            if (missing.length > 0) {
                state.exercises = [...state.exercises, ...missing];
                this.saveData(this.KEY_DB_EXERCISES, state.exercises);
            }
        } else {
            state.exercises = JSON.parse(JSON.stringify(defaultExercises));
            this.saveData(this.KEY_DB_EXERCISES, state.exercises);
        }

        if (storedWo && Object.keys(storedWo).length > 0) {
            state.workouts = storedWo;
        } else {
            state.workouts = JSON.parse(JSON.stringify(defaultWorkouts));
            this.saveData(this.KEY_DB_WORKOUTS, state.workouts);
        }
    },

    // --- SESSION RECOVERY METHODS ---
    saveSessionState() {
        // Deep copy state to avoid reference issues
        const sessionData = {
            state: JSON.parse(JSON.stringify(state)),
            timestamp: Date.now()
        };
        // Clean up transient things like timerInterval ID
        sessionData.state.timerInterval = null; 
        this.saveData(this.KEY_SESSION, sessionData);
    },

    clearSessionState() {
        localStorage.removeItem(this.KEY_SESSION);
    },

    hasActiveSession() {
        return !!localStorage.getItem(this.KEY_SESSION);
    },

    getSessionState() {
        return this.getData(this.KEY_SESSION);
    },
    // ---------------------------------

    resetFactory() {
        if(confirm("פעולה זו תאפס את כל התרגילים והאימונים לברירת המחדל, אך תשמור על היסטוריית הביצועים והמשקלים. האם להמשיך?")) {
            localStorage.removeItem(this.KEY_DB_EXERCISES);
            localStorage.removeItem(this.KEY_DB_WORKOUTS);
            localStorage.removeItem(this.KEY_SESSION); // Clear any stuck session
            location.reload();
        }
    },

    getLastWeight(exName) {
        const data = this.getData(this.KEY_WEIGHTS) || {};
        return data[exName] || null;
    },

    saveWeight(exName, weight) {
        const data = this.getData(this.KEY_WEIGHTS) || {};
        data[exName] = weight;
        this.saveData(this.KEY_WEIGHTS, data);
    },

    getLastRM(exName) {
        const data = this.getData(this.KEY_RM) || {};
        return data[exName] || null;
    },

    saveRM(exName, rmVal) {
        const data = this.getData(this.KEY_RM) || {};
        data[exName] = rmVal;
        this.saveData(this.KEY_RM, data);
    },

    saveToArchive(workoutObj) {
        let history = this.getData(this.KEY_ARCHIVE) || [];
        history.unshift(workoutObj);
        this.saveData(this.KEY_ARCHIVE, history);
    },

    getArchive() {
        return this.getData(this.KEY_ARCHIVE) || [];
    },
    
    deleteFromArchive(timestamp) {
        let history = this.getArchive();
        history = history.filter(h => h.timestamp !== timestamp);
        this.saveData(this.KEY_ARCHIVE, history);
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
        if(dataObj.archive) this.saveData(this.KEY_ARCHIVE, dataObj.archive);
    },

    exportConfiguration() {
        const configData = {
            type: 'config_only',
            version: '12.5.2',
            date: new Date().toISOString(),
            workouts: this.getData(this.KEY_DB_WORKOUTS),
            exercises: this.getData(this.KEY_DB_EXERCISES)
        };
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(new Blob([JSON.stringify(configData, null, 2)], {type: "application/json"})); 
        a.download = `gympro_config_${new Date().toISOString().slice(0,10)}.json`; 
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },

    importConfiguration(data) {
        if (data.type !== 'config_only') {
            alert("שגיאה: הקובץ שנבחר אינו קובץ תבנית אימונים תקין.");
            return;
        }

        if(confirm("פעולה זו תדרוס את התוכניות והתרגילים הקיימים במערכת (אך תשמור על היסטוריית הביצועים). האם להמשיך?")) {
            this.saveData(this.KEY_DB_WORKOUTS, data.workouts);
            this.saveData(this.KEY_DB_EXERCISES, data.exercises);
            alert("התבניות נטענו בהצלחה! האפליקציה תרענן את עצמה.");
            location.reload();
        }
    }
};

// --- INITIALIZATION ---
window.onload = () => {
    StorageManager.initDB();
    renderWorkoutMenu();
    checkRecovery(); // Check for interrupted session
};

// --- RECOVERY LOGIC ---
function checkRecovery() {
    if (StorageManager.hasActiveSession()) {
        const session = StorageManager.getSessionState();
        // Check if session is not too old (e.g., 24 hours) - Optional, here keeping it simple
        document.getElementById('recovery-modal').style.display = 'flex';
    }
}

function restoreSession() {
    const session = StorageManager.getSessionState();
    if (session && session.state) {
        state = session.state;
        
        // Hide modal
        document.getElementById('recovery-modal').style.display = 'none';
        
        // Determine where to navigate
        const lastScreen = state.historyStack[state.historyStack.length - 1];
        
        // If we are deep in execution (ui-main), we need to re-init pickers
        if (lastScreen === 'ui-main') {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('ui-main').classList.add('active');
            
            // Re-render pickers based on restored state
            initPickers();
            
            // If timer was running, we can't really restore exact second accurately without diffing timestamps, 
            // but we can at least show the timer area if needed.
            if (state.seconds > 0) {
                 document.getElementById('timer-area').style.visibility = 'visible';
                 // Optionally restart timer? keeping it paused/stopped is safer.
            }
        } else {
            // Just navigate to the screen
            navigate(lastScreen);
            
            // If it was confirm screen, re-render it
            if (lastScreen === 'ui-confirm') {
                showConfirmScreen(state.currentExName);
            }
        }
        haptic('success');
    } else {
        discardSession();
    }
}

function discardSession() {
    StorageManager.clearSessionState();
    document.getElementById('recovery-modal').style.display = 'none';
}

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
    btn.innerHTML = `<div class="card-text center-text">מנוע סאונד פעיל</div>`;
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

    // --- SETTINGS BUTTON VISIBILITY LOGIC ---
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.style.visibility = (id === 'ui-week') ? 'visible' : 'hidden';
    }
}

function handleBackClick() {
    haptic('warning');
    if (state.historyStack.length <= 1) return;

    const currentScreen = state.historyStack[state.historyStack.length - 1];

    if (currentScreen === 'ui-main') {
        if (state.setIdx > 0) {
            deleteLastSet();
            return;
        } else {
            state.setIdx = 0;
            stopRestTimer();
            state.historyStack.pop(); 
            navigate('ui-confirm');
            return;
        }
    }

    if (currentScreen === 'ui-confirm') {
        if (state.log.length > 0 || state.completedExInSession.length > 0) {
            if(confirm("האם לצאת מהאימון?")) {
                // If exiting, clear session
                StorageManager.clearSessionState();
            } else {
                return;
            }
        }
        state.historyStack.pop(); 
        const prev = state.historyStack[state.historyStack.length - 1];
        navigate(prev); 
        return;
    }

    if (currentScreen === 'ui-workout-manager') { state.historyStack.pop(); navigate('ui-settings'); return; }
    if (currentScreen === 'ui-workout-editor') { 
        if(confirm("לצאת ללא שמירה?")) {
            state.historyStack.pop(); navigate('ui-workout-manager'); 
        }
        return; 
    }
    if (currentScreen === 'ui-exercise-selector') { state.historyStack.pop(); navigate('ui-workout-editor'); return; }
    if (currentScreen === 'ui-archive') { state.historyStack.pop(); navigate('ui-week'); return; }
    if (currentScreen === 'ui-archive-detail') { state.historyStack.pop(); navigate('ui-archive'); return; }
    if (currentScreen === 'ui-swap-list') { state.historyStack.pop(); navigate('ui-confirm'); return; }
    if (currentScreen === 'ui-settings') { state.historyStack.pop(); navigate('ui-week'); return; }

    state.historyStack.pop();
    const prevScreen = state.historyStack[state.historyStack.length - 1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prevScreen).classList.add('active');
    document.getElementById('global-back').style.visibility = (prevScreen === 'ui-week') ? 'hidden' : 'visible';
    
    // Update settings visibility on back
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.style.visibility = (prevScreen === 'ui-week') ? 'visible' : 'hidden';
    }
}

function openSettings() {
    navigate('ui-settings');
}

function resetToFactorySettings() {
    StorageManager.resetFactory();
}

// --- DYNAMIC MAIN MENU ---
function renderWorkoutMenu() {
    const container = document.getElementById('workout-menu-container');
    container.innerHTML = "";
    
    Object.keys(state.workouts).forEach(key => {
        const btn = document.createElement('button');
        btn.className = "menu-card tall";
        
        let count = 0;
        state.workouts[key].forEach(item => {
            if(item.type === 'cluster') count += item.exercises.length;
            else count++;
        });
        
        btn.innerHTML = `<h3>${key}</h3><p>${count} תרגילים</p>`;
        btn.onclick = () => selectWorkout(key);
        container.appendChild(btn);
    });
}

// --- WORKOUT MANAGER SYSTEM ---

function openWorkoutManager() {
    renderManagerList();
    navigate('ui-workout-manager');
}

function renderManagerList() {
    const list = document.getElementById('manager-list');
    list.innerHTML = "";
    
    const keys = Object.keys(state.workouts);
    if(keys.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:var(--text-dim)'>אין תוכניות שמורות</p>";
        return;
    }

    keys.forEach(key => {
        const wo = state.workouts[key];
        const el = document.createElement('div');
        el.className = "manager-item";
        el.onclick = () => editWorkout(key); 
        
        let count = 0;
        wo.forEach(item => {
            if(item.type === 'cluster') count += item.exercises.length;
            else count++;
        });

        el.innerHTML = `
            <div class="manager-info">
                <h3>${key}</h3>
                <p>${count} תרגילים</p>
            </div>
            <div class="manager-actions">
                <button class="btn-text-action" onclick="event.stopPropagation(); duplicateWorkout('${key}')">שכפל</button>
                <button class="btn-text-action delete" onclick="event.stopPropagation(); deleteWorkout('${key}')">מחק</button>
            </div>
        `;
        list.appendChild(el);
    });
}

function deleteWorkout(key) {
    if(confirm(`האם למחוק את תוכנית ${key}?`)) {
        delete state.workouts[key];
        StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
        renderManagerList();
        renderWorkoutMenu(); 
    }
}

function duplicateWorkout(key) {
    const newName = key + " Copy";
    if (state.workouts[newName]) {
        alert("שם התוכנית כבר קיים");
        return;
    }
    state.workouts[newName] = JSON.parse(JSON.stringify(state.workouts[key]));
    StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
    renderManagerList();
    renderWorkoutMenu();
}

function createNewWorkout() {
    managerState.originalName = '';
    managerState.currentName = 'New Plan';
    managerState.exercises = [];
    openEditorUI();
}

function editWorkout(key) {
    managerState.originalName = key;
    managerState.currentName = key;
    managerState.exercises = JSON.parse(JSON.stringify(state.workouts[key])); 
    openEditorUI();
}

function openEditorUI() {
    document.getElementById('editor-workout-name').value = managerState.currentName;
    renderEditorList();
    navigate('ui-workout-editor');
}

// --- WORKOUT EDITOR & CLUSTER SUPPORT ---

function renderEditorList() {
    const list = document.getElementById('editor-list');
    list.innerHTML = "";
    
    managerState.exercises.forEach((item, idx) => {
        if (item.type === 'cluster') {
            renderClusterItem(item, idx, list);
        } else {
            renderRegularItem(item, idx, list);
        }
    });
}

function renderRegularItem(item, idx, list) {
    const row = document.createElement('div');
    row.className = "editor-row";
    
    let setControls = '';
    if (!item.isMain) {
        setControls = `
            <div class="set-selector">
                <button class="set-btn" onclick="changeSetCount(${idx}, -1)">-</button>
                <span class="set-val">${item.sets}</span>
                <button class="set-btn" onclick="changeSetCount(${idx}, 1)">+</button>
            </div>
        `;
    } else {
        setControls = `<span style="font-size:0.8em; color:var(--text-dim); margin:0 5px;">1RM</span>`;
    }

    row.innerHTML = `
        <div class="row-info" onclick="openRestTimerModal(${idx})">${item.name}</div>
        <div class="editor-controls">
            <button class="badge-main ${item.isMain ? 'active' : ''}" onclick="toggleMainStatus(${idx})">MAIN</button>
            ${setControls}
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, -1)">▲</button>
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, 1)">▼</button>
            <button class="control-icon-btn" onclick="removeExFromEditor(${idx})" style="color:#ff453a; border-color: rgba(255,69,58,0.3);">✕</button>
        </div>
    `;
    list.appendChild(row);
}

function renderClusterItem(cluster, idx, list) {
    const box = document.createElement('div');
    box.className = "cluster-box";
    
    // Cluster Header
    let html = `
    <div class="cluster-header">
        <div class="cluster-title">סבב / מעגל (Cluster)</div>
        <div class="editor-controls">
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, -1)">▲</button>
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, 1)">▼</button>
            <button class="control-icon-btn" onclick="removeExFromEditor(${idx})" style="color:#ff453a;">✕</button>
        </div>
    </div>
    <div class="input-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:10px;">
        <div class="glass-card compact" style="margin:0; padding:8px;">
            <label>מס' סבבים</label>
            <div class="set-selector" style="justify-content:center;">
                <button class="set-btn" onclick="changeClusterRounds(${idx}, -1)">-</button>
                <span class="set-val">${cluster.rounds}</span>
                <button class="set-btn" onclick="changeClusterRounds(${idx}, 1)">+</button>
            </div>
        </div>
        <div class="glass-card compact" style="margin:0; padding:8px;">
            <label>מנוחה בסוף סבב</label>
            <div class="set-selector" style="justify-content:center;">
                <button class="set-btn" onclick="changeClusterRest(${idx}, -30)">-</button>
                <span class="set-val" style="width:40px;">${cluster.clusterRest}s</span>
                <button class="set-btn" onclick="changeClusterRest(${idx}, 30)">+</button>
            </div>
        </div>
    </div>
    <div class="cluster-content vertical-stack">
    `;

    // Inner Exercises
    cluster.exercises.forEach((ex, internalIdx) => {
        html += `
        <div class="editor-row" style="padding: 8px; background:rgba(255,255,255,0.05);">
            <div class="row-info" onclick="openRestTimerModal(${idx}, ${internalIdx})">${internalIdx+1}. ${ex.name}</div>
            <div class="editor-controls">
                 <button class="control-icon-btn" style="width:24px; height:24px;" onclick="removeExFromCluster(${idx}, ${internalIdx})">✕</button>
            </div>
        </div>`;
    });

    html += `
        <button class="btn-text" style="font-size:0.8em; padding:8px; color:var(--type-free);" onclick="openExerciseSelectorForCluster(${idx})">+ הוסף תרגיל לסבב</button>
    </div>`;

    box.innerHTML = html;
    list.appendChild(box);
}

// Editor Actions
function toggleMainStatus(idx) {
    managerState.exercises[idx].isMain = !managerState.exercises[idx].isMain;
    renderEditorList();
}

function changeSetCount(idx, delta) {
    let current = managerState.exercises[idx].sets;
    current += delta;
    if (current < 1) current = 1;
    if (current > 10) current = 10;
    managerState.exercises[idx].sets = current;
    renderEditorList();
}

function moveExInEditor(idx, dir) {
    if (idx + dir < 0 || idx + dir >= managerState.exercises.length) return;
    const temp = managerState.exercises[idx];
    managerState.exercises[idx] = managerState.exercises[idx + dir];
    managerState.exercises[idx + dir] = temp;
    renderEditorList();
}

function removeExFromEditor(idx) {
    managerState.exercises.splice(idx, 1);
    renderEditorList();
}

function changeClusterRounds(idx, delta) {
    let val = managerState.exercises[idx].rounds + delta;
    if (val < 1) val = 1;
    managerState.exercises[idx].rounds = val;
    renderEditorList();
}

function changeClusterRest(idx, delta) {
    let val = managerState.exercises[idx].clusterRest + delta;
    if (val < 0) val = 0;
    managerState.exercises[idx].clusterRest = val;
    renderEditorList();
}

function addClusterToEditor() {
    managerState.exercises.push({
        type: 'cluster',
        rounds: 3,
        clusterRest: 120,
        exercises: []
    });
    renderEditorList();
}

function removeExFromCluster(clusterIdx, exIdx) {
    managerState.exercises[clusterIdx].exercises.splice(exIdx, 1);
    renderEditorList();
}

function saveWorkoutChanges() {
    const newName = document.getElementById('editor-workout-name').value.trim();
    if (!newName) { alert("נא להזין שם לתוכנית"); return; }
    if (managerState.exercises.length === 0) { alert("התוכנית ריקה!"); return; }

    if (newName !== managerState.originalName) {
        if (state.workouts[newName]) { alert("שם תוכנית זה כבר קיים, נא לבחור שם אחר"); return; }
        if (managerState.originalName) delete state.workouts[managerState.originalName];
    }
    
    state.workouts[newName] = managerState.exercises;
    StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
    
    haptic('success');
    renderWorkoutMenu(); 
    navigate('ui-workout-manager');
    renderManagerList();
}

// --- REST TIMER EDITING ---

function openRestTimerModal(idx, internalIdx = null) {
    let ex;
    if (internalIdx !== null) {
        ex = managerState.exercises[idx].exercises[internalIdx];
        managerState.editingTimerEx = { idx, internalIdx };
    } else {
        ex = managerState.exercises[idx];
        managerState.editingTimerEx = { idx, internalIdx: null };
    }

    document.getElementById('ex-settings-title').innerText = ex.name;
    const time = ex.restTime || (ex.isMain ? 120 : 90);
    document.getElementById('rest-time-display').innerText = time + "s";
    document.getElementById('exercise-settings-modal').style.display = 'flex';
}

function changeRestTime(delta) {
    const display = document.getElementById('rest-time-display');
    let current = parseInt(display.innerText.replace('s', ''));
    current += delta;
    if (current < 0) current = 0;
    display.innerText = current + "s";
}

function saveExerciseSettings() {
    const val = parseInt(document.getElementById('rest-time-display').innerText.replace('s', ''));
    const { idx, internalIdx } = managerState.editingTimerEx;
    
    if (internalIdx !== null) {
        managerState.exercises[idx].exercises[internalIdx].restTime = val;
    } else {
        managerState.exercises[idx].restTime = val;
    }
    
    closeExerciseSettings();
}

function closeExerciseSettings() {
    document.getElementById('exercise-settings-modal').style.display = 'none';
    managerState.editingTimerEx = null;
}

// --- SMART EXERCISE SELECTOR ---

function openExerciseSelector() {
    managerState.activeClusterRef = null; 
    prepareSelector();
}

function openExerciseSelectorForCluster(clusterIdx) {
    managerState.activeClusterRef = clusterIdx;
    prepareSelector();
}

function prepareSelector() {
    document.getElementById('selector-search').value = "";
    managerState.selectorFilter = 'all';
    updateSelectorChips();
    renderSelectorList();
    navigate('ui-exercise-selector');
}

function setSelectorFilter(filter, btn) {
    managerState.selectorFilter = filter;
    updateSelectorChips();
    renderSelectorList();
}

function updateSelectorChips() {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const btns = document.querySelectorAll('#ui-exercise-selector .chip');
    btns.forEach(b => {
        const onClickFn = b.getAttribute('onclick');
        if (onClickFn.includes(`'${managerState.selectorFilter}'`)) {
            b.classList.add('active');
        }
    });
}

function filterSelector() {
    renderSelectorList();
}

function renderSelectorList() {
    const list = document.getElementById('selector-list');
    list.innerHTML = "";
    
    const searchVal = document.getElementById('selector-search').value.toLowerCase();
    
    const filtered = state.exercises.filter(ex => {
        const matchesFilter = managerState.selectorFilter === 'all' || ex.muscles.includes(managerState.selectorFilter);
        const matchesSearch = ex.name.toLowerCase().includes(searchVal);
        return matchesFilter && matchesSearch;
    });

    filtered.forEach(ex => {
        const btn = document.createElement('button');
        btn.className = "menu-card";
        btn.innerHTML = `<span>${ex.name}</span><div class="chevron"></div>`;
        btn.onclick = () => {
            const newExObj = {
                name: ex.name,
                isMain: false,
                sets: 3,
                restTime: 90 
            };
            
            if (managerState.activeClusterRef !== null) {
                newExObj.restTime = 30; // Default circuit rest
                managerState.exercises[managerState.activeClusterRef].exercises.push(newExObj);
            } else {
                managerState.exercises.push(newExObj);
            }
            
            navigate('ui-workout-editor');
            renderEditorList();
        };
        list.appendChild(btn);
    });
}

// --- WORKOUT FLOW ENGINE (ZIG-ZAG & CLUSTERS) ---

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; 
    state.completedExInSession = []; state.isArmPhase = false; state.isFreestyle = false; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    state.clusterMode = false;
    
    StorageManager.saveSessionState(); // SAVE STATE
    checkFlow();
}

function checkFlow() {
    const workoutList = state.workouts[state.type];
    
    if (state.exIdx >= workoutList.length) {
        navigate('ui-ask-extra');
        return;
    }

    const item = workoutList[state.exIdx];

    // IF CLUSTER
    if (item.type === 'cluster') {
        state.clusterMode = true;
        state.activeCluster = JSON.parse(JSON.stringify(item)); 
        state.clusterIdx = 0;
        state.clusterRound = 1;
        state.lastClusterRest = 30; // Default init
        
        // Show Cluster Entry Screen (New Requirement)
        showConfirmScreen();
    } 
    // IF REGULAR
    else {
        state.clusterMode = false;
        state.activeCluster = null;
        if (isExOrVariationDone(item.name)) {
            state.exIdx++;
            checkFlow(); 
        } else {
            showConfirmScreen();
        }
    }
}

function showConfirmScreen(forceExName = null) {
    StorageManager.saveSessionState(); // SAVE STATE
    
    // --- CLUSTER ENTRY SCREEN LOGIC ---
    if (state.clusterMode && state.clusterIdx === 0 && !forceExName) {
        // Render special Cluster Entry screen inside ui-confirm
        document.getElementById('confirm-ex-name').innerText = "סבב / מעגל (Cluster)";
        document.getElementById('confirm-ex-config').innerText = `סבב ${state.clusterRound} מתוך ${state.activeCluster.rounds}`;
        document.getElementById('confirm-ex-config').style.display = 'block';

        const historyContainer = document.getElementById('history-container');
        // List exercises
        let listHtml = `<div class="vertical-stack" style="text-align:right; margin: 20px 0;">`;
        state.activeCluster.exercises.forEach((ex, i) => {
            listHtml += `<div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; margin-bottom:5px;">${i+1}. ${ex.name}</div>`;
        });
        listHtml += `</div>`;
        historyContainer.innerHTML = listHtml;
        
        // Hide standard buttons, we only need Start
        document.querySelector('.secondary-buttons-grid').style.display = 'none';
        
        // FIX: Navigation logic missing in previous version causing broken state
        navigate('ui-confirm');
        
        return;
    }

    // --- STANDARD EXERCISE LOGIC (Or triggered manually inside cluster) ---
    document.querySelector('.secondary-buttons-grid').style.display = 'grid'; // Restore buttons

    let exName = forceExName;
    let currentPlanItem = null;

    if (!exName) {
        currentPlanItem = state.workouts[state.type][state.exIdx];
        exName = currentPlanItem.name;
    }
    
    // Logic for loading exercise data...
    const exData = state.exercises.find(e => e.name === exName);
    if (!exData) { alert("שגיאה: התרגיל לא נמצא במאגר."); return; }

    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    
    if (state.clusterMode) {
        const clusterEx = state.activeCluster.exercises[state.clusterIdx];
        if (clusterEx.restTime) state.currentEx.restTime = clusterEx.restTime;
    } else if (currentPlanItem && currentPlanItem.restTime) {
        state.currentEx.restTime = currentPlanItem.restTime;
    }

    document.getElementById('confirm-ex-name').innerText = exData.name;
    const configDiv = document.getElementById('confirm-ex-config');
    
    if (state.clusterMode) {
        configDiv.innerHTML = `חלק מסבב (${state.clusterRound}/${state.activeCluster.rounds})`;
        configDiv.style.display = 'block';
    } else if (currentPlanItem) {
        if (currentPlanItem.isMain) {
            configDiv.innerHTML = "MAIN (מחושב 1RM)";
        } else {
            configDiv.innerHTML = `תוכנית: ${currentPlanItem.sets} סטים`;
        }
        configDiv.style.display = 'block';
    } else {
        configDiv.style.display = 'none';
    }

    // New button logic - specific hidden state
    const swapBtn = document.getElementById('btn-swap-confirm');
    const addBtn = document.getElementById('btn-add-exercise');
    
    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption && !state.isArmPhase) {
        swapBtn.style.visibility = 'visible';
        addBtn.style.visibility = 'visible'; // Show Add button in normal flow
    } else {
        swapBtn.style.visibility = 'hidden'; // Keep layout but hide
        addBtn.style.visibility = 'hidden'; 
    }

    // --- HISTORY UI (NEW GRID SYSTEM) ---
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = "";
    
    const history = getLastPerformance(exName);
    
    if (history) {
        let rowsHtml = "";
        history.sets.forEach((setStr, idx) => {
            // Parse set string: "80kg x 8 (RIR 2) | Note..."
            let weight = "-", reps = "-", rir = "-";
            
            try {
                const parts = setStr.split('x');
                if(parts.length > 1) {
                    weight = parts[0].replace('kg', '').trim();
                    const rest = parts[1];
                    const rirMatch = rest.match(/\(RIR (.*?)\)/);
                    reps = rest.split('(')[0].trim();
                    if(rirMatch) rir = rirMatch[1];
                }
            } catch(e) {}

            rowsHtml += `
            <div class="history-row">
                <div class="history-col set-idx">#${idx + 1}</div>
                <div class="history-col">${weight}</div>
                <div class="history-col">${reps}</div>
                <div class="history-col rir-note">${rir}</div>
            </div>`;
        });

        const gridHtml = `
        <div class="history-card-container">
            <div style="font-size:0.85em; color:var(--text-dim); text-align:right; margin-bottom:10px;">📅 ביצוע אחרון: ${history.date}</div>
            <div class="history-header">
                <div>סט</div>
                <div>משקל</div>
                <div>חזרות</div>
                <div>RIR</div>
            </div>
            <div class="history-list">
                ${rowsHtml}
            </div>
        </div>
        `;
        historyContainer.innerHTML = gridHtml;
    }

    navigate('ui-confirm');
}

function getLastPerformance(exName) {
    const archive = StorageManager.getArchive();
    for (const item of archive) {
        if (item.details && item.details[exName]) {
            return { date: item.date, sets: item.details[exName].sets };
        }
    }
    return null;
}

function confirmExercise(doEx) {
    if (state.clusterMode && state.clusterIdx === 0 && document.getElementById('confirm-ex-name').innerText.includes("Cluster")) {
        // Clicked Start on Cluster Entry Screen
        // Start first exercise
        const firstExName = state.activeCluster.exercises[0].name;
        // Proceed to setup
        // Need to set up state.currentEx correctly
        const exData = state.exercises.find(e => e.name === firstExName);
        state.currentEx = JSON.parse(JSON.stringify(exData));
        state.currentExName = exData.name;
        if(state.activeCluster.exercises[0].restTime) state.currentEx.restTime = state.activeCluster.exercises[0].restTime;
        
        // Fall through to startRecording
        // Set target sets to 1 for flow
        resizeSets(1);
        startRecording();
        return;
    }

    if (!doEx) { 
        state.log.push({ skip: true, exName: state.currentExName }); 
        if(!state.clusterMode) state.completedExInSession.push(state.currentExName); 
        finishCurrentExercise(); 
        return; 
    }
    
    let isMain = state.currentEx.isCalc; 
    let targetSets = null;

    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption && !state.isArmPhase) {
        if (state.clusterMode) {
             targetSets = 1;
             isMain = false;
        } else {
            const planItem = state.workouts[state.type][state.exIdx];
            if (planItem) {
                isMain = planItem.isMain;
                targetSets = planItem.sets;
            }
        }
    }

    if (isMain) {
        state.currentEx.isCalc = true; 
        setupCalculatedEx(); 
    } else {
        if (targetSets && targetSets > 0) {
            resizeSets(targetSets);
        }
        startRecording();
    }
}

function resizeSets(count) {
    // FIX: Try to preserve default reps from first set if possible, otherwise default to 10
    const defaultReps = (state.currentEx.sets && state.currentEx.sets[0]) ? state.currentEx.sets[0].r : 10;
    const defaultWeight = (state.currentEx.sets && state.currentEx.sets[0]) ? state.currentEx.sets[0].w : 10;
    
    state.currentEx.sets = Array(count).fill({w: defaultWeight, r: defaultReps});
}

function setupCalculatedEx() {
    document.getElementById('rm-title').innerText = `${state.currentExName} 1RM`;
    const lastRM = StorageManager.getLastRM(state.currentExName);
    const baseRM = state.currentEx.baseRM || 50; 
    const p = document.getElementById('rm-picker'); p.innerHTML = "";
    const defaultRM = lastRM ? lastRM : baseRM;
    for(let i = 20; i <= 200; i += 2.5) {
        let o = new Option(i + " kg", i); if(i === defaultRM) o.selected = true; p.add(o);
    }
    navigate('ui-1rm');
}

function save1RM() {
    state.rm = parseFloat(document.getElementById('rm-picker').value);
    StorageManager.saveRM(state.currentExName, state.rm);
    
    let percentages = []; let reps = [];
    
    // SAFETY: Parse int to ensure week is treated as number
    const w = parseInt(state.week);
    
    if (w === 1) { percentages = [0.65, 0.75, 0.85, 0.75, 0.65]; reps = [5, 5, 5, 8, 10]; } 
    else if (w === 2) { percentages = [0.70, 0.80, 0.90, 0.80, 0.70, 0.70]; reps = [3, 3, 3, 8, 10, 10]; } 
    else if (w === 3) { percentages = [0.75, 0.85, 0.95, 0.85, 0.75, 0.75]; reps = [5, 3, 1, 8, 10, 10]; }
    else { 
        // Fallback default (Treat like week 1) if data is corrupted
        percentages = [0.65, 0.75, 0.85, 0.75, 0.65]; reps = [5, 5, 5, 8, 10]; 
    }

    state.currentEx.sets = percentages.map((pct, i) => ({ w: Math.round((state.rm * pct) / 2.5) * 2.5, r: reps[i] }));
    startRecording();
}

function startRecording() { 
    state.setIdx = 0; 
    state.lastLoggedSet = null; // Clear last set for new exercise
    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    
    StorageManager.saveSessionState(); // SAVE STATE
    
    navigate('ui-main'); 
    initPickers(); 
}

function isUnilateral(exName) {
    return unilateralKeywords.some(keyword => exName.includes(keyword));
}

function initPickers() {
    document.getElementById('ex-display-name').innerText = state.currentExName;
    
    // Inject Cluster Queue if needed
    const exHeader = document.querySelector('.exercise-header');
    const existingQueue = document.querySelector('.cluster-queue-container');
    if (existingQueue) existingQueue.remove();

    if (state.clusterMode) {
        const queueDiv = document.createElement('div');
        queueDiv.className = 'cluster-queue-container';
        let queueHtml = `<div class="queue-title">בהמשך הסבב:</div>`;
        
        let foundNext = false;
        for (let i = state.clusterIdx + 1; i < state.activeCluster.exercises.length; i++) {
            const exName = state.activeCluster.exercises[i].name;
            const isNext = !foundNext;
            queueHtml += `<div class="queue-item ${isNext ? 'next' : ''}">${isNext ? '• הבא: ' : ''}${exName}</div>`;
            foundNext = true;
        }
        if (!foundNext) queueHtml += `<div class="queue-item">--- סוף סבב ---</div>`;
        
        queueDiv.innerHTML = queueHtml;
        // Insert after header
        exHeader.parentNode.insertBefore(queueDiv, exHeader.nextSibling);
    }

    // Badge Update
    const badge = document.getElementById('set-counter');
    if (state.clusterMode) {
        badge.innerText = `ROUND ${state.clusterRound}/${state.activeCluster.rounds}`;
        badge.style.background = "var(--type-free)";
    } else {
        badge.innerText = `SET ${state.setIdx + 1}/${state.currentEx.sets.length}`;
        badge.style.background = "var(--accent)";
    }

    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('set-notes').value = '';
    
    // History
    const hist = document.getElementById('last-set-info');
    if (state.lastLoggedSet) {
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
        hist.style.display = 'block';
    } else hist.style.display = 'none';
    
    document.getElementById('unilateral-note').style.display = isUnilateral(state.currentExName) ? 'block' : 'none';
    document.getElementById('btn-warmup').style.display = (state.setIdx === 0 && !state.clusterMode && ["Squat", "Deadlift", "Bench", "Overhead"].some(k => state.currentExName.includes(k))) ? 'block' : 'none';
    
    // Timer visibility (Hide unless explicitly shown in standard flow, or active in cluster)
    const timerArea = document.getElementById('timer-area');
    // If we just arrived here in Cluster mode with a running timer
    if (state.clusterMode && state.timerInterval) {
        timerArea.style.visibility = 'visible';
    } else if (state.setIdx > 0 && document.getElementById('action-panel').style.display === 'none') { 
        timerArea.style.visibility = 'visible'; 
        resetAndStartTimer(); 
    } else { 
        timerArea.style.visibility = 'hidden'; 
        // Do not stop timer if cluster flow is active!
        if (!state.clusterMode) stopRestTimer(); 
    }

    const skipBtn = document.getElementById('btn-skip-exercise');
    skipBtn.style.display = (state.setIdx === 0) ? 'none' : 'block';

    // Weights & Reps - FIX 1RM PRIORITY
    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    const step = state.currentEx.step || 2.5;
    const savedWeight = StorageManager.getLastWeight(state.currentExName);
    
    let defaultW;
    if (state.currentEx.isCalc) {
        defaultW = target.w; // Priority to calculated weight
    } else {
        defaultW = state.lastLoggedSet ? state.lastLoggedSet.w : (state.setIdx === 0 && savedWeight ? savedWeight : (target ? target.w : 0));
    }
    
    let minW = Math.max(0, defaultW - 40); 
    let maxW = defaultW + 50;
    if (state.currentEx.minW !== undefined) minW = Math.max(state.currentEx.minW, minW);
    
    for(let i = minW; i <= maxW; i = parseFloat((i + step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === defaultW) o.selected = true; wPick.add(o);
    }
    
    // --- 1RM FIX: Logic for default Reps ---
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    
    let currentR;
    if (state.currentEx.isCalc) {
        // If Calculated/Main: Use TARGET reps (ignore last set history)
        currentR = target ? target.r : 5;
    } else {
        // If Regular: Use Last Set (if exists) for comfort, else target
        currentR = state.lastLoggedSet ? state.lastLoggedSet.r : (target ? target.r : 8);
    }
    
    for(let i = 1; i <= 30; i++) { let o = new Option(i, i); if(i === currentR) o.selected = true; rPick.add(o); }
    
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "Fail" : v, v); if(v === 2) o.selected = true; rirPick.add(o);
    });
}

// --- TIMER LOGIC ---

function resetAndStartTimer(customTime = null) {
    stopRestTimer(); state.seconds = 0; state.startTime = Date.now();
    
    let target = 90;
    if (customTime !== null) {
        target = customTime;
    } else {
        if (state.currentEx.restTime) {
            target = state.currentEx.restTime;
        } else {
             target = (state.exIdx === 0 && !state.clusterMode && !state.isArmPhase) ? 120 : 90;
        }
    }
    
    const circle = document.getElementById('timer-progress'); 
    const text = document.getElementById('rest-timer');
    const clusterBar = document.getElementById('cluster-timer-bar');
    const clusterText = document.getElementById('cluster-timer-text');

    const updateUI = (mins, secs, progress) => {
        if(text) text.innerText = `${mins}:${secs}`;
        if(circle) circle.style.strokeDashoffset = 283 - (progress * 283);
        
        if(clusterText) clusterText.innerText = `${mins}:${secs}`;
        if(clusterBar) clusterBar.style.strokeDashoffset = 283 - (progress * 283);
    };

    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        state.seconds = elapsed;
        const mins = Math.floor(state.seconds / 60).toString().padStart(2, '0');
        const secs = (state.seconds % 60).toString().padStart(2, '0');
        const progress = Math.min(state.seconds / target, 1);
        
        updateUI(mins, secs, progress);
        
        if (state.seconds === target) playBeep(2);
    }, 100); 
}

function stopRestTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

function nextStep() {
    haptic('light');
    const wVal = parseFloat(document.getElementById('weight-picker').value);
    const noteVal = document.getElementById('set-notes').value.trim();
    const entry = { exName: state.currentExName, w: wVal, r: parseInt(document.getElementById('reps-picker').value), rir: document.getElementById('rir-picker').value, note: noteVal };
    StorageManager.saveWeight(state.currentExName, wVal);
    state.log.push(entry); state.lastLoggedSet = entry;

    StorageManager.saveSessionState(); // SAVE STATE

    // --- CLUSTER FLOW LOGIC (Instant Transition) ---
    if (state.clusterMode) {
        // Store current rest time before switching
        state.lastClusterRest = state.currentEx.restTime || 30;

        // Is there another exercise in this round?
        if (state.clusterIdx < state.activeCluster.exercises.length - 1) {
            // YES: Switch immediately
            state.clusterIdx++;
            const nextExName = state.activeCluster.exercises[state.clusterIdx].name;
            const exData = state.exercises.find(e => e.name === nextExName);
            
            // Set up next exercise
            state.currentEx = JSON.parse(JSON.stringify(exData));
            state.currentExName = exData.name;
            if(state.activeCluster.exercises[state.clusterIdx].restTime) state.currentEx.restTime = state.activeCluster.exercises[state.clusterIdx].restTime;
            state.currentEx.sets = [{w:10, r:10}]; // Dummy set structure
            
            // Reset state for new exercise input
            state.setIdx = 0;
            state.lastLoggedSet = null; // Important: Clear visual history of previous different exercise
            
            // Re-render UI
            initPickers();
            
            // Start Timer (using previous exercise rest time)
            document.getElementById('timer-area').style.visibility = 'visible';
            resetAndStartTimer(state.lastClusterRest);
            
            return; // EXIT FUNCTION, Stay in ui-main
        } else {
            // End of round exercises.
            // FIX: If this is the last exercise of the round, finish immediately! No action panel.
             finishCurrentExercise();
             return;
        }
    }

    if (state.setIdx < state.currentEx.sets.length - 1) { 
        state.setIdx++; 
        initPickers(); 
        // In-set timer (Regular mode)
        document.getElementById('timer-area').style.visibility = 'visible'; 
        resetAndStartTimer();
    } else { 
        haptic('medium'); 
        document.getElementById('btn-submit-set').style.display = 'none';
        document.getElementById('btn-skip-exercise').style.display = 'none';
        
        document.getElementById('action-panel').style.display = 'block';
        
        let nextName = getNextExerciseName();
        document.getElementById('next-ex-preview').innerText = `הבא בתור: ${nextName}`;
        
        // --- FIX: NO TIMER IN STANDARD ACTION PANEL ---
        if (!state.clusterMode) {
            document.getElementById('timer-area').style.visibility = 'hidden';
            stopRestTimer();
        }
    }
}

function getNextExerciseName() {
    if (state.isInterruption) return "חזרה למסלול";
    if (state.isExtraPhase) return "תרגיל נוסף";
    if (state.isArmPhase) return "ידיים";
    if (state.exIdx < state.workouts[state.type].length - 1) return state.workouts[state.type][state.exIdx + 1].name;
    return "סיום אימון";
}

function finishCurrentExercise() {
    state.historyStack = state.historyStack.filter(s => s !== 'ui-main');
    
    StorageManager.saveSessionState(); // SAVE STATE

    if (state.clusterMode) {
        handleClusterFlow();
    } else {
        if (!state.completedExInSession.includes(state.currentExName)) state.completedExInSession.push(state.currentExName);
        
        if (state.isInterruption) { state.isInterruption = false; navigate('ui-confirm'); } 
        else if (state.isExtraPhase) { navigate('ui-ask-extra'); } 
        else if (state.isArmPhase) { showArmSelection(); } 
        else if (state.isFreestyle) { showExerciseList(state.currentMuscle); } 
        else { checkFlow(); }
    }
}

function handleClusterFlow() {
    // If we are here, it means we finished the last exercise of the round (via nextStep branching)
    navigate('ui-cluster-rest');
    
    const btnMain = document.getElementById('btn-cluster-main');
    const btnSkip = document.getElementById('btn-cluster-skip-text');
        
    if (state.clusterRound < state.activeCluster.rounds) {
        document.getElementById('cluster-status-text').innerText = `סיום סבב ${state.clusterRound} מתוך ${state.activeCluster.rounds}`;
        document.getElementById('btn-extra-round').style.display = 'none';
        
        // Normal Flow Buttons
        btnMain.innerText = "התחל סבב הבא";
        btnMain.onclick = startNextRound;
        btnSkip.style.display = 'block';
        
        resetAndStartTimer(state.activeCluster.clusterRest);
    } else {
        document.getElementById('cluster-status-text').innerText = `הסבבים הושלמו (${state.activeCluster.rounds})`;
        document.getElementById('btn-extra-round').style.display = 'block';
        stopRestTimer();
        document.getElementById('cluster-timer-text').innerText = "✓";
        
        // Finish Flow Buttons
        btnMain.innerText = "סיום";
        btnMain.onclick = finishCluster;
        btnSkip.style.display = 'none'; // Hide red button
    }
    
    const listDiv = document.getElementById('cluster-next-list');
    listDiv.innerHTML = state.activeCluster.exercises.map((e,i) => `<div>${i+1}. ${e.name}</div>`).join('');
}

function startNextRound() {
    state.clusterRound++;
    state.clusterIdx = 0;
    stopRestTimer();
    
    // Jump straight to first exercise of next round (similar to Instant Transition)
    const nextExName = state.activeCluster.exercises[0].name;
    const exData = state.exercises.find(e => e.name === nextExName);
    
    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    if(state.activeCluster.exercises[0].restTime) state.currentEx.restTime = state.activeCluster.exercises[0].restTime;
    
    state.currentEx.sets = [{w:10, r:10}];
    
    // Manual setup like confirmExercise(true)
    startRecording();
}

function addExtraRound() {
    state.activeCluster.rounds++;
    // Re-render rest screen logic
    handleClusterFlow();
}

function finishCluster() {
    state.clusterMode = false;
    state.activeCluster = null;
    state.exIdx++; 
    checkFlow();
}

// --- STANDARD FUNCTIONS ---

function skipCurrentExercise() {
    if(confirm("לדלג על תרגיל זה ולעבור לבא?")) {
        state.log.push({ skip: true, exName: state.currentExName });
        finishCurrentExercise();
    }
}

function addExtraSet() {
    state.setIdx++;
    state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]});
    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    initPickers();
    document.getElementById('timer-area').style.visibility = 'visible'; 
    resetAndStartTimer();
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

function startFreestyle() {
    state.type = 'Freestyle'; state.log = []; state.completedExInSession = [];
    state.isArmPhase = false; state.isFreestyle = true; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    document.getElementById('btn-resume-flow').style.display = 'none';
    document.getElementById('btn-finish-extra').style.display = 'none';
    
    StorageManager.saveSessionState(); // SAVE STATE
    
    navigate('ui-muscle-select');
}

function showExerciseList(muscle) {
    state.currentMuscle = muscle;
    state.freestyleFilter = 'all'; 
    const chipContainer = document.getElementById('variation-chips');
    chipContainer.style.display = 'none';
    chipContainer.innerHTML = '';
    document.getElementById('variation-title').innerText = `תרגילי ${muscle}`;
    const options = document.getElementById('variation-options');
    options.innerHTML = "";

    if (state.isFreestyle) {
        const backBtn = document.createElement('button');
        backBtn.className = "btn-text";
        backBtn.style.color = "var(--accent)";
        backBtn.style.textAlign = "right";
        backBtn.style.marginBottom = "10px";
        backBtn.innerText = "חזור לבחירת קבוצת שריר";
        backBtn.onclick = () => navigate('ui-muscle-select'); 
        options.appendChild(backBtn);
    }

    if (muscle === 'רגליים') {
        chipContainer.style.display = 'flex';
        renderFreestyleChips(['all', 'quads', 'hamstrings', 'calves'], 'רגליים');
    } else if (muscle === 'ידיים') {
        chipContainer.style.display = 'flex';
        renderFreestyleChips(['all', 'biceps', 'triceps'], 'ידיים');
    }

    renderFreestyleList();
    navigate('ui-variation');
}

function renderFreestyleChips(filters, mainMuscle) {
    const container = document.getElementById('variation-chips');
    container.innerHTML = "";
    const labels = { 'all': 'הכל', 'quads': 'ארבע ראשי', 'hamstrings': 'ירך אחורית', 'calves': 'תאומים', 'biceps': 'יד קדמית', 'triceps': 'יד אחורית' };
    filters.forEach(f => {
        const btn = document.createElement('button');
        btn.className = `chip ${state.freestyleFilter === f ? 'active' : ''}`;
        btn.innerText = labels[f] || f;
        btn.onclick = () => { state.freestyleFilter = f; renderFreestyleChips(filters, mainMuscle); renderFreestyleList(); };
        container.appendChild(btn);
    });
}

function renderFreestyleList() {
    const options = document.getElementById('variation-options');
    const backBtn = options.querySelector('.btn-text');
    options.innerHTML = "";
    if(backBtn) options.appendChild(backBtn);
    let filtered = state.exercises.filter(ex => ex.muscles.includes(state.currentMuscle) && !state.completedExInSession.includes(ex.name));
    if (state.freestyleFilter !== 'all') filtered = filtered.filter(ex => ex.muscles.includes(state.freestyleFilter));
    filtered.forEach(ex => {
        const btn = document.createElement('button'); btn.className = "menu-card";
        btn.innerHTML = `<span>${ex.name}</span><div class="chevron"></div>`;
        btn.onclick = () => {
            state.currentEx = JSON.parse(JSON.stringify(ex));
            state.currentExName = ex.name;
            if(!state.currentEx.sets || state.currentEx.sets.length < 3) state.currentEx.sets = [{w:10, r:10}, {w:10, r:10}, {w:10, r:10}];
            startRecording();
        };
        options.appendChild(btn);
    });
}

function startArmWorkout() { 
    state.isArmPhase = true; 
    document.getElementById('arm-selection-title').innerText = "מה להתחיל?";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    const btnBi = document.createElement('button'); btnBi.className = "menu-card"; btnBi.innerHTML = `<span>יד קדמית (Biceps)</span><div class="chevron"></div>`;
    btnBi.onclick = () => { state.armGroup = 'biceps'; state.firstArmGroup = 'biceps'; state.secondArmGroup = 'triceps'; showArmSelection(); };
    const btnTri = document.createElement('button'); btnTri.className = "menu-card"; btnTri.innerHTML = `<span>יד אחורית (Triceps)</span><div class="chevron"></div>`;
    btnTri.onclick = () => { state.armGroup = 'triceps'; state.firstArmGroup = 'triceps'; state.secondArmGroup = 'biceps'; showArmSelection(); };
    opts.appendChild(btnBi); opts.appendChild(btnTri);
    document.getElementById('btn-skip-arm-group').style.display = 'none';
    navigate('ui-arm-selection');
}

function showArmSelection() {
    const list = state.exercises.filter(ex => ex.muscles.includes(state.armGroup));
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
    StorageManager.clearSessionState(); // CLEAR SESSION

    state.workoutDurationMins = Math.floor((Date.now() - state.workoutStartTime) / 60000);
    navigate('ui-summary');
    document.getElementById('summary-note').value = "";
    const workoutDisplayName = state.type; 
    const dateStr = new Date().toLocaleDateString('he-IL');
    let summaryText = `GYMPRO ELITE SUMMARY\n${workoutDisplayName} | Week ${state.week} | ${dateStr} | ${state.workoutDurationMins}m\n\n`;
    let grouped = {};
    state.log.forEach(e => {
        if (!grouped[e.exName]) grouped[e.exName] = { sets: [], vol: 0, hasWarmup: false };
        if (e.isWarmup) grouped[e.exName].hasWarmup = true;
        else if (!e.skip) {
            let weightStr = `${e.w}kg`;
            if (isUnilateral(e.exName)) weightStr += ` (יד אחת)`;
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
    state.lastWorkoutDetails = grouped;
}

function copyResult() {
    let text = document.getElementById('summary-area').innerText;
    const userNote = document.getElementById('summary-note').value.trim();
    if (userNote) text += `\n\n📝 הערות כלליות: ${userNote}`;
    const workoutDisplayName = state.type;
    const dateStr = new Date().toLocaleDateString('he-IL');
    const archiveObj = { id: Date.now(), date: dateStr, timestamp: Date.now(), type: workoutDisplayName, week: state.week, duration: state.workoutDurationMins, summary: text, details: state.lastWorkoutDetails, generalNote: userNote };
    StorageManager.saveToArchive(archiveObj);
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => { haptic('light'); alert("הסיכום נשמר בארכיון והועתק!"); location.reload(); }); } 
    else { const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); alert("הסיכום נשמר בארכיון והועתק!"); location.reload(); }
}

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

function renderArchiveList() {
    const list = document.getElementById('archive-list'); list.innerHTML = "";
    selectedArchiveIds.clear(); updateCopySelectedBtn();
    const history = StorageManager.getArchive();
    if (history.length === 0) { list.innerHTML = `<div style="text-align:center; color:gray; margin-top:20px;">אין אימונים שמורים</div>`; } 
    else {
        history.forEach(item => {
            const card = document.createElement('div'); card.className = "menu-card"; card.style.cursor = "default";
            const weekStr = item.week ? ` • שבוע ${item.week}` : '';
            card.innerHTML = `<div class="archive-card-row"><input type="checkbox" class="archive-checkbox" data-id="${item.timestamp}"><div class="archive-info"><div style="display:flex; justify-content:space-between; width:100%;"><h3 style="margin:0;">${item.date}</h3><span style="font-size:0.8em; color:#8E8E93">${item.duration} דק'</span></div><p style="margin:0; color:#8E8E93; font-size:0.85em;">${item.type}${weekStr}</p></div><div class="chevron"></div></div>`;
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

function changeMonth(delta) {
    state.calendarOffset += delta;
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = "";
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + state.calendarOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    document.getElementById('current-month-display').innerText = `${monthNames[month]} ${year}`;
    const firstDayIndex = targetDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const history = StorageManager.getArchive();
    const monthWorkouts = history.filter(item => {
        const d = new Date(item.timestamp);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    for(let i = 0; i < firstDayIndex; i++) {
        const cell = document.createElement('div'); cell.className = "calendar-cell empty"; grid.appendChild(cell);
    }
    const today = new Date();
    for(let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div'); cell.className = "calendar-cell";
        cell.innerHTML = `<span>${day}</span>`;
        if(state.calendarOffset === 0 && day === today.getDate()) cell.classList.add('today');
        const dailyWorkouts = monthWorkouts.filter(item => new Date(item.timestamp).getDate() === day);
        if(dailyWorkouts.length > 0) {
            const dotsContainer = document.createElement('div'); dotsContainer.className = "dots-container";
            dailyWorkouts.forEach(wo => {
                const dot = document.createElement('div');
                let dotClass = 'type-free';
                if(wo.type.includes('כתפיים - גב - חזה') || wo.type.includes('A')) dotClass = 'type-a';
                else if(wo.type.includes('רגליים - גב') || wo.type.includes('B')) dotClass = 'type-b';
                else if(wo.type.includes('חזה - כתפיים') || wo.type.includes('C')) dotClass = 'type-c';
                dot.className = `dot ${dotClass}`;
                dotsContainer.appendChild(dot);
            });
            cell.appendChild(dotsContainer);
            cell.onclick = () => openDayDrawer(dailyWorkouts, day, monthNames[month]);
        }
        grid.appendChild(cell);
    }
}

function openDayDrawer(workouts, day, monthName) {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    const content = document.getElementById('sheet-content');
    let html = `<h3>${day} ב${monthName}</h3>`;
    if(workouts.length === 0) { html += `<p>אין אימונים ביום זה</p>`; } 
    else {
        html += `<p>נמצאו ${workouts.length} אימונים:</p>`;
        workouts.forEach(wo => {
            let dotColor = '#BF5AF2';
            if(wo.type.includes('כתפיים - גב - חזה') || wo.type.includes('A')) dotColor = '#0A84FF';
            else if(wo.type.includes('רגליים - גב') || wo.type.includes('B')) dotColor = '#32D74B';
            else if(wo.type.includes('חזה - כתפיים') || wo.type.includes('C')) dotColor = '#FF9F0A';
            html += `
            <div class="mini-workout-item" onclick='openArchiveFromDrawer(${JSON.stringify(wo).replace(/'/g, "&#39;")})'>
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.95em;">${wo.type}</div>
                    <div style="font-size:0.8em; color:#8E8E93;">${wo.duration} דק' • ${new Date(wo.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="chevron"></div>
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

function triggerConfigImport() { document.getElementById('import-config-file').click(); }

function processConfigImport(input) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            StorageManager.importConfiguration(data);
        } catch(err) { alert("שגיאה בטעינת הקובץ."); }
    };
    reader.readAsText(file);
}

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
                <div class="chevron"></div>
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

    const btnDelete = document.getElementById('btn-delete-last-set');
    if (index === state.log.length - 1) {
        btnDelete.style.display = 'block';
    } else {
        btnDelete.style.display = 'none';
    }

    closeDayDrawer(); 
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

    state.log[state.editingIndex].w = w;
    state.log[state.editingIndex].r = r;
    state.log[state.editingIndex].rir = rir;
    state.log[state.editingIndex].note = note;

    if (state.editingIndex === state.log.length - 1) {
        state.lastLoggedSet = state.log[state.editingIndex];
        const hist = document.getElementById('last-set-info');
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
    }

    // UPDATE SAVED STATE AFTER EDIT
    StorageManager.saveSessionState();

    closeEditModal();
    haptic('success');
    openSessionLog(); 
}

function deleteLastSet() {
    if (confirm("האם למחוק את הסט האחרון? פעולה זו תחזיר אותך צעד אחד אחורה.")) {
        state.log.pop();
        state.lastLoggedSet = state.log.length > 0 ? state.log[state.log.length - 1] : null;
        
        if (document.getElementById('action-panel').style.display === 'block') {
             document.getElementById('action-panel').style.display = 'none';
             document.getElementById('btn-submit-set').style.display = 'block';
        } else if (state.setIdx > 0) {
            state.setIdx--;
        }
        
        // UPDATE SAVED STATE
        StorageManager.saveSessionState();

        closeEditModal();
        haptic('warning');
        initPickers(); 
    }
}

// SWAP MENU
function openSwapMenu() {
    const container = document.getElementById('swap-container'); 
    container.innerHTML = "";
    
    const workoutList = state.workouts[state.type]; if (!workoutList) return;

    // 1. VARIATIONS
    const variations = getSubstitutes(state.currentExName).filter(name => !state.completedExInSession.includes(name));
    
    if (variations.length > 0) {
        const titleVar = document.createElement('div');
        titleVar.className = "section-label";
        titleVar.innerText = `וריאציות (מחליף את הנוכחי)`;
        container.appendChild(titleVar);

        variations.forEach(vName => {
            const btn = document.createElement('button'); 
            btn.className = "menu-card"; 
            btn.innerHTML = `<span>${vName}</span><div class="chevron"></div>`;
            btn.onclick = () => {
                const newExData = state.exercises.find(e => e.name === vName);
                if (newExData) {
                    state.currentExName = vName;
                    showConfirmScreen(vName);
                }
            };
            container.appendChild(btn);
        });
    }

    // 2. REORDER
    const titleOrder = document.createElement('div');
    titleOrder.className = "section-label";
    titleOrder.innerText = `שאר האימון (שינוי סדר)`;
    titleOrder.style.marginTop = "20px";
    container.appendChild(titleOrder);

    const remaining = workoutList.filter(item => {
        if(item.type === 'cluster') return true; 
        const isDone = isExOrVariationDone(item.name);
        const isCurrent = item.name === state.currentExName;
        return !isDone && !isCurrent;
    });
    
    if (remaining.length === 0) {
        const empty = document.createElement('p');
        empty.style.textAlign = 'center';
        empty.style.color = 'var(--text-dim)';
        empty.innerText = 'אין תרגילים נוספים להחלפה';
        container.appendChild(empty);
    } else {
        remaining.forEach(item => {
            if (item.type !== 'cluster') {
                const btn = document.createElement('button'); 
                btn.className = "menu-card"; 
                btn.innerHTML = `<span>${item.name}</span><div class="chevron"></div>`;
                btn.onclick = () => { 
                    state.exIdx = state.workouts[state.type].findIndex(x => x.name === item.name); 
                    showConfirmScreen(); 
                };
                container.appendChild(btn);
            }
        });
    }

    navigate('ui-swap-list');
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
function markWarmupDone() { 
    state.log.push({ exName: state.currentExName, isWarmup: true }); 
    StorageManager.saveSessionState(); // SAVE STATE
    closeWarmup(); 
}
