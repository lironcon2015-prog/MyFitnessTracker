/**
 * AI Coach Module for GymPro Elite
 * Handles Gemini API communication, Context Injection, and Chart.js rendering.
 * Version: 12.12.6 (Stable 2026 Edition)
 */

const AICoach = {
    KEY_STORAGE: 'gympro_ai_key',
    
    // Updated Model List for 2026 Stability
    AVAILABLE_MODELS: [
        'gemini-2.0-flash',       // New Standard (Fastest)
        'gemini-1.5-flash',       // Previous Standard (Backup)
        'gemini-1.5-pro',         // High Intelligence (Backup)
        'gemini-pro'              // Universal Fallback
    ],

    // --- State Management ---
    
    getKey() {
        const key = localStorage.getItem(this.KEY_STORAGE);
        return key ? key.trim() : null;
    },

    saveKey() {
        const input = document.getElementById('ai-api-key');
        const key = input.value.trim();
        if (!key) { alert("נא להזין מפתח תקין"); return; }
        
        localStorage.setItem(this.KEY_STORAGE, key);
        alert("המפתח נשמר בהצלחה!");
        if (typeof handleBackClick === 'function') handleBackClick(); 
    },

    init() {
        if (!this.getKey()) {
            if(confirm("AI Coach דורש הגדרת מפתח API. לעבור להגדרות?")) {
                if (typeof navigate === 'function') navigate('ui-ai-settings');
            }
            return false;
        }
        if (typeof navigate === 'function') navigate('ui-ai-chat');
        setTimeout(() => this.scrollToBottom(), 100);
        return true;
    },

    clearChat() {
        if(confirm("האם למחוק את היסטוריית הצ'אט הנוכחית?")) {
            document.getElementById('chat-container').innerHTML = `
                <div class="chat-bubble ai">
                    השיחה אופסה. אני מוכן לנתח את הנתונים מחדש!
                </div>
            `;
        }
    },

    // --- Prompt Engineering ---
    async generateSystemPrompt() {
        const allData = (typeof StorageManager !== 'undefined') ? StorageManager.getAllData() : { archive: [], weights: {}, rms: {} };
        const archive = allData.archive || [];
        const weights = allData.weights || {};
        const rms = allData.rms || {};

        const recentHistory = archive.slice(0, 15).map(w => ({
            date: w.date,
            type: w.type,
            summary: w.summary
        }));

        const stats = {
            lastWorkout: archive.length > 0 ? archive[0] : "None",
            currentWeights: weights,
            estimated1RM: rms,
            totalWorkouts: archive.length
        };

        return `
        You are an elite Gym Coach for "GYMPRO ELITE".
        Language: Hebrew (Ivrit) ONLY.
        Tone: Professional, motivating, concise.
        
        INSTRUCTION:
        If user asks for a chart/graph, return ONLY JSON: {"type": "chart", ...}.
        
        User Data:
        ${JSON.stringify(stats)}

        Recent History:
        ${JSON.stringify(recentHistory)}
        `;
    },

    // --- Communication Core ---
    async sendMessage() {
        const inputEl = document.getElementById('chat-input');
        const userText = inputEl.value.trim();
        if (!userText) return;

        // 1. UI: User Bubble
        this.addBubble(userText, 'user');
        inputEl.value = '';
        this.scrollToBottom();

        // 2. UI: Loading Indicator
        const loadingId = this.addLoadingBubble();
        this.scrollToBottom();

        try {
            const key = this.getKey();
            if (!key) throw new Error("Missing API Key");

            const systemPrompt = await this.generateSystemPrompt();
            const fullPrompt = `${systemPrompt}\n\nUSER QUESTION:\n${userText}`;

            const payload = {
                contents: [{ parts: [{ text: fullPrompt }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            };

            let success = false;
            let finalData = null;
            let usedModel = '';
            let firstError = null;

            // 3. Logic: Model Rotation with Timeout
            for (const model of this.AVAILABLE_MODELS) {
                console.log(`[AI] Trying: ${model}`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                
                // Timeout Controller (15 Seconds limit per request)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: controller.signal // Link abort signal
                    });
                    
                    clearTimeout(timeoutId); // Clear timeout on response

                    if (response.ok) {
                        finalData = await response.json();
                        success = true;
                        usedModel = model;
                        break; 
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        const msg = errData.error?.message || response.statusText;
                        console.warn(`[AI] Fail ${model}: ${msg}`);
                        if (!firstError) firstError = `${model}: ${msg}`;
                    }
                } catch (e) {
                    clearTimeout(timeoutId);
                    const isTimeout = e.name === 'AbortError';
                    const msg = isTimeout ? "Timeout (15s)" : e.message;
                    console.warn(`[AI] Error ${model}: ${msg}`);
                    if (!firstError) firstError = `Network: ${msg}`;
                }
            }

            // 4. Cleanup UI
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();

            // 5. Handle Final Result
            if (!success || !finalData) {
                this.addBubble(`⚠️ **שגיאה**\nלא הצלחתי להתחבר. סיבה:\n${firstError || 'Unknown Error'}`, 'ai');
                return;
            }

            if (finalData.error) {
                this.addBubble(`שגיאת שרת: ${finalData.error.message}`, 'ai');
                return;
            }

            if (!finalData.candidates || !finalData.candidates[0]) {
                 if(finalData.promptFeedback?.blockReason) {
                     this.addBubble(`⚠️ התוכן נחסם ע"י גוגל (${finalData.promptFeedback.blockReason}).`, 'ai');
                 } else {
                     this.addBubble("התקבלה תשובה ריקה.", 'ai');
                 }
                 return;
            }

            const aiText = finalData.candidates[0].content.parts[0].text;
            this.handleAIResponse(aiText);
            console.log(`[AI] Success with: ${usedModel}`);

        } catch (err) {
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
            this.addBubble(`שגיאה קריטית: ${err.message}`, 'ai');
        }
    },

    // --- Response Handling ---
    handleAIResponse(text) {
        if (!text) return;
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanText.startsWith('{') && cleanText.includes('"type": "chart"')) {
            try {
                this.renderChartBubble(JSON.parse(cleanText));
            } catch (e) {
                this.addBubble(text, 'ai'); 
            }
        } else {
            this.addBubble(text, 'ai');
        }
    },

    addBubble(text, type) {
        const container = document.getElementById('chat-container');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        container.appendChild(bubble);
        this.scrollToBottom();
    },

    addLoadingBubble() {
        const container = document.getElementById('chat-container');
        const id = 'loading-' + Date.now();
        const bubble = document.createElement('div');
        bubble.id = id;
        bubble.className = 'chat-bubble ai';
        bubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        container.appendChild(bubble);
        return id;
    },

    renderChartBubble(chartJson) {
        const container = document.getElementById('chat-container');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ai';
        
        if (chartJson.description) {
            const desc = document.createElement('div');
            desc.style.marginBottom = "10px";
            desc.innerText = chartJson.description;
            bubble.appendChild(desc);
        }

        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);
        bubble.appendChild(chartWrapper);
        container.appendChild(bubble);

        try {
            new Chart(canvas, {
                type: chartJson.chartType || 'line',
                data: {
                    labels: chartJson.labels,
                    datasets: [{
                        label: chartJson.title,
                        data: chartJson.data,
                        borderColor: '#0A84FF',
                        backgroundColor: 'rgba(10, 132, 255, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#fff' } } },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#8E8E93' },
                            title: { display: true, text: chartJson.yLabel || 'Value', color: '#8E8E93' }
                        },
                        x: { grid: { display: false }, ticks: { color: '#8E8E93' } }
                    }
                }
            });
        } catch (e) {
            bubble.innerHTML += `<br><span style="color:red; font-size:0.8em;">שגיאה בטעינת הגרף</span>`;
        }
        this.scrollToBottom();
    },

    scrollToBottom() {
        const screen = document.getElementById('ui-ai-chat');
        if (screen) {
            screen.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
        }
    }
};

window.AICoach = AICoach;
