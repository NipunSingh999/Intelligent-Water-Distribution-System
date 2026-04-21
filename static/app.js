let chart;
let previousAnomalies = new Set();
let currentView = 'dashboard';

// View Switching Logic
window.switchView = function(viewId) {
    // hide all
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
    
    // show target
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`).classList.add('active');
    
    currentView = viewId;
    
    const titles = {
        'dashboard': 'Network Overview',
        'map': 'Live Hydraulic Map',
        'ai': 'AI Diagnostic Center',
        'settings': 'System Configuration'
    };
    document.getElementById('page-title').innerText = titles[viewId];
}

// Generate synth warning beep without external audio files
function playWarningBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') { audioCtx.resume(); }
        
        // Two quick beeps for urgency
        for(let i=0; i<2; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime + (i*0.3));
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime + (i*0.3));
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (i*0.3) + 0.2);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + (i*0.3));
            osc.stop(audioCtx.currentTime + (i*0.3) + 0.2);
        }
    } catch(e) {
        console.log("Audio blocked by browser auto-play policy. Click the screen first!");
    }
}

// Initialize Chart.js
function initChart() {
    const ctx = document.getElementById('telemetryChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Avg Pressure (bar)',
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                data: []
            }, {
                label: 'Avg Flow (LPM)',
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { display: false },
                y: { grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });
}

// Map Valve interactions
async function toggleValve(zoneId) {
    try {
        await fetch(`/api/valve/${zoneId}/toggle`, { method: 'POST' });
        fetchData(); // instantly update
    } catch (e) { console.error('Toggle failed', e); }
}

function processValves(valves) {
    const container = document.getElementById('valve-container');
    container.innerHTML = '';
    valves.forEach(v => {
        const div = document.createElement('div');
        div.className = 'valve-item';
        div.onclick = () => toggleValve(v.zone);
        
        const stateClass = v.status === 'OPEN' ? 'open' : 'closed';
        div.innerHTML = `
            <div class="valve-id">Zone ${v.zone}</div>
            <span class="valve-state ${stateClass}">${v.status}</span>
        `;
        container.appendChild(div);
    });
}

function processAlerts(readings) {
    const alertList = document.getElementById('alert-list');
    const globalStatus = document.getElementById('global-status');
    let hasActiveLeak = false;

    // We process the most recent readings first
    const recentAnomalies = readings.filter(r => r.anomaly);
    
    if (recentAnomalies.length > 0) hasActiveLeak = true;

    if (hasActiveLeak) {
        globalStatus.textContent = 'CRITICAL: LEAK DETECTED';
        globalStatus.className = 'status-indicator danger';
    } else {
        globalStatus.textContent = 'SECURE';
        globalStatus.className = 'status-indicator safe';
    }

    // Add new alerts to UI
    recentAnomalies.forEach(a => {
        const alertId = `${a.zone}-${a.time}`;
        if (!previousAnomalies.has(alertId)) {
            previousAnomalies.add(alertId);
            const li = document.createElement('li');
            li.className = 'alert-item';
            
            const date = new Date(a.time);
            li.innerHTML = `
                <div class="alert-title">AI: Leak Signature Detected</div>
                <div class="alert-desc">Zone ${a.zone} | P: ${a.pressure.toFixed(1)}bar | F: ${a.flow.toFixed(1)}lpm</div>
                <span class="alert-time">${date.toLocaleTimeString()}</span>
            `;
            alertList.prepend(li);
            playWarningBeep(); // Trigger Sound
        }
    });

    // Keep log short
    while (alertList.children.length > 20) {
        alertList.removeChild(alertList.lastChild);
    }
}

function processChart(readings) {
    // Process top 50 recent timestamps, calculate averages across all zones
    // Because data is mixed, we group by time roughly
    if(readings.length === 0) return;
    
    // Sort chronological
    const sorted = [...readings].sort((a,b) => new Date(a.time) - new Date(b.time));
    
    // Simplified: Just plotting sequential readings to show graph moving
    const times = sorted.slice(-60).map(r => r.time);
    const pressures = sorted.slice(-60).map(r => r.pressure);
    const flows = sorted.slice(-60).map(r => r.flow);
    
    chart.data.labels = times;
    chart.data.datasets[0].data = pressures;
    chart.data.datasets[1].data = flows;
    chart.update();
}

function processMap(readings) {
    // Only process map if we are on the map view to save DOM updates
    const container = document.getElementById('map-container');
    
    // Get latest reading for each zone
    let latest = {};
    readings.forEach(r => {
        if (!latest[r.zone] || new Date(r.time) > new Date(latest[r.zone].time)) {
            latest[r.zone] = r;
        }
    });

    container.innerHTML = '';
    // We expect 5 zones
    for(let i=1; i<=5; i++) {
        const r = latest[i];
        if(!r) continue;
        
        let statusClass = 'safe';
        if (r.pressure < 30 || r.pressure > 70) statusClass = 'warning';
        if (r.anomaly) statusClass = 'danger';

        const div = document.createElement('div');
        div.className = `map-node ${statusClass}`;
        div.innerHTML = `
            Z${i}
            <div class="node-val">${r.pressure.toFixed(1)}b</div>
        `;
        container.appendChild(div);
        
        // Add connector lines between nodes except the last one
        if(i < 5) {
            const line = document.createElement('div');
            line.style.flex = "1";
            line.style.height = "4px";
            line.style.background = statusClass === 'danger' ? "var(--color-danger)" : "var(--color-safe)";
            line.style.opacity = "0.5";
            container.appendChild(line);
        }
    }
}

async function fetchData() {
    try {
        const res = await fetch('/api/dashboard_data');
        const data = await res.json();
        
        processValves(data.valves);
        processAlerts(data.readings);
        processChart(data.readings);
        processMap(data.readings);
    } catch(e) {
        console.log("Waiting for backend...");
    }
}

initChart();
setInterval(fetchData, 1000); // 1-second refresh rate
