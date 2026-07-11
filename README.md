# 💧 Intelligent Water Distribution System

> A software-simulated IoT + ML system for real-time water monitoring, leak detection, and usage analytics — built in support of **SDG 11: Sustainable Cities and Communities**.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=flat&logo=flask&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-660066?style=flat&logo=eclipsemosquitto&logoColor=white)
![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?style=flat&logo=scikitlearn&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## 📌 About the Project

Urban water distribution networks lose **20–40% of their water supply** due to undetected leaks, pipe bursts, and inefficient distribution — a critical problem for growing cities. This project presents a fully software-simulated Intelligent Water Distribution System that:

- **Simulates** multi-zone sensor data (flow rate, pressure, turbidity) in real time
- **Detects leaks and anomalies** using a Machine Learning model (Isolation Forest)
- **Visualizes** live sensor readings on a web dashboard with charts and alerts
- **Stores** all readings in a local database for historical analysis

Built as a mini-project for B.Tech CSE (3rd Year), this system demonstrates an end-to-end IoT + ML pipeline without requiring any physical hardware.

---

## 🎯 SDG 11 Connection

**Sustainable Development Goal 11** calls for making cities inclusive, safe, resilient, and sustainable. This project directly contributes by:

| SDG Target | How This Project Helps |
|---|---|
| 11.1 — Safe water access | Early leak detection ensures supply continuity |
| 11.6 — Reduce environmental impact | Minimizing water waste reduces treatment load |
| 11.b — Resilient infrastructure | Data-driven monitoring improves network resilience |

---

## 🏗️ System Architecture

```
sensor_simulator.py
      │
      │  MQTT (paho)
      ▼
Mosquitto Broker (localhost:1883)
      │
      │  subscribe
      ▼
Flask Backend (app.py)
  ├── SQLite Database  ← stores all readings
  ├── ML Model         ← Isolation Forest anomaly detection
  └── REST API         ← /api/readings, /api/alerts
            │
            │  HTTP (fetch every 3s)
            ▼
     Web Dashboard (HTML + Chart.js)
  ├── Live flow & pressure charts
  ├── Real-time stat cards
  └── Leak alert table
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Sensor Simulation | Python, NumPy, `paho-mqtt` |
| MQTT Broker | Mosquitto (localhost) |
| Backend API | Python, Flask, Flask-CORS |
| Database | SQLite3 |
| ML / Anomaly Detection | scikit-learn (Isolation Forest) |
| Frontend Dashboard | HTML5, CSS3, JavaScript, Chart.js |

---

## 📁 Project Structure

```
water_distribution/
│
├── simulator/
│   └── sensor_simulator.py     # Generates realistic sensor data via MQTT
│
├── backend/
│   ├── app.py                  # Flask API + MQTT subscriber
│   ├── model.py                # Isolation Forest ML model
│   └── database.db             # Auto-created SQLite database
│
├── dashboard/
│   ├── index.html              # Main dashboard page
│   ├── style.css               # Styling
│   └── app.js                  # Chart.js live data + API calls
│
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.10+
- [Mosquitto MQTT Broker](https://mosquitto.org/download/) installed on Windows
- VS Code (recommended editor)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/intelligent-water-distribution.git
cd intelligent-water-distribution
```

### 2. Install Python dependencies

```bash
pip install flask flask-cors paho-mqtt scikit-learn pandas numpy
```

### 3. Start the MQTT broker (Windows)

```cmd
net start mosquitto
```

### 4. Run the backend server

```cmd
python backend/app.py
```

### 5. Start the sensor simulator

Open a new terminal:

```cmd
python simulator/sensor_simulator.py
```

### 6. Open the dashboard

Open `dashboard/index.html` directly in Chrome or any browser. Live data will appear within seconds.

---

## 🤖 ML Model — Anomaly Detection

The system uses **Isolation Forest** from scikit-learn to detect anomalies in sensor readings:

- **Input features:** flow rate, pressure, turbidity
- **Training data:** first 200 readings from the simulator (normal baseline)
- **Detection logic:** sudden pressure drop + abnormal flow spike → flagged as leak
- **Output:** `is_anomaly = 1` stored in DB, alert shown on dashboard

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(contamination=0.1, random_state=42)
model.fit(normal_readings)
prediction = model.predict(new_reading)  # -1 = anomaly, 1 = normal
```

---

## 📊 Simulated Scenarios

The sensor simulator generates the following scenarios automatically:

| Scenario | Flow Rate | Pressure | Trigger |
|---|---|---|---|
| Normal operation | 12–18 L/min | ~3.5 bar | Continuous |
| Peak demand (morning/evening) | 18–22 L/min | ~3.2 bar | Sine wave pattern |
| Pipe leak | +7 L/min spike | drops to ~1.5 bar | Every 5 minutes |
| Water quality issue | — | — | Turbidity spike > 4 NTU |

---

## 🖥️ Dashboard Features

- **Live stat cards** — current flow rate, pressure, turbidity, alert count
- **Real-time line charts** — flow and pressure plotted every 3 seconds
- **Leak alert table** — timestamped list of all detected anomalies
- **Auto-refresh** — no page reload needed, polls Flask API silently

---

## 🚀 Future Enhancements

- [ ] Multi-zone support (Zone 1, 2, 3 with separate pipelines)
- [ ] SMS/email alerts via Twilio or SMTP
- [ ] Water usage forecasting using ARIMA or LSTM
- [ ] Map view showing pipe network zones (Leaflet.js)
- [ ] Mobile Android app for field operator alerts (Kotlin)
- [ ] Docker containerization for easy deployment

---

## 👨‍💻 Author

**Nipun Singh**
B.Tech CSE, 3rd Year — I.T.S. Engineering College, Greater Noida (2023–2027)


[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/your-profile)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/your-username)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

> *"What we cannot measure, we cannot improve."* — This project is a step toward measurable, intelligent water management for sustainable cities.
