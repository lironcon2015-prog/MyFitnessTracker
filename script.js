:root {
    --bg-color: #f2f2f7; 
    --card-bg: #ffffff;
    --primary-blue: #007AFF;
    --text-main: #1c1c1e;
    --text-dim: #8e8e93;
    --danger: #ff3b30;
    --success: #34c759;
    --border-color: #d1d1d6;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-main);
    direction: rtl;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior: none;
}

.app-container {
    max-width: 500px;
    margin: 0 auto;
    padding: calc(env(safe-area-inset-top) + 20px) 20px 40px 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.screen { display: none; flex-direction: column; flex-grow: 1; }
.screen.active { display: flex; animation: fadeIn 0.3s ease; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.btn-primary, .btn-secondary, .menu-item, .btn-danger {
    width: 100%;
    padding: 18px;
    border-radius: 16px;
    font-size: 1.1em;
    font-weight: 700;
    border: none;
    cursor: pointer;
    margin-bottom: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s;
    box-sizing: border-box;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.btn-primary { background-color: var(--primary-blue); color: white; }
.btn-secondary { background-color: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); }
.btn-danger { background-color: #fff; color: var(--danger); border: 1px solid var(--danger); }

.menu-item {
    background-color: var(--card-bg);
    color: var(--text-main);
    border: 1px solid var(--border-color);
    justify-content: space-between;
}

.btn-primary:active { transform: scale(0.96); opacity: 0.9; }

.log-card {
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 22px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}

.exercise-title {
    font-size: 1.8em;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0 0 10px 0;
}

.section-subtitle {
    font-size: 0.85em;
    text-transform: uppercase;
    color: var(--text-dim);
    font-weight: 700;
    margin-bottom: 8px;
}

.input-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f2f2f7;
}
.input-row:last-child { border-bottom: none; }

.modern-select {
    background-color: #f2f2f7;
    border: none;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 1em;
    font-weight: 700;
    min-width: 90px;
    text-align: center;
}

.timer-display {
    font-size: 5em;
    font-weight: 200;
    text-align: center;
    margin: 10px 0;
    font-variant-numeric: tabular-nums;
}

.set-badge {
    background-color: #e5e5ea;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 0.8em;
    font-weight: 800;
}

.summary-box {
    background-color: #1c1c1e;
    color: #32d74b;
    padding: 20px;
    border-radius: 16px;
    font-family: monospace;
    margin-bottom: 20px;
    font-size: 0.9em;
    overflow-x: auto;
}
