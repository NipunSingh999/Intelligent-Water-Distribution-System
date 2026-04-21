from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, init_db, SensorReading, SmartValve
from ml_engine import AnomalyDetector
import os

app = FastAPI(title="IWDS Digital Twin Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

init_db()
detector = AnomalyDetector()

from simulator import run_simulator
import threading
import time

@app.on_event("startup")
def startup_event():
    # Delay simulator launch slightly to ensure API is ready to accept HTTP POSTs
    def delayed_start():
        time.sleep(3)
        run_simulator()
    threading.Thread(target=delayed_start, daemon=True).start()

# serve static frontend
os.makedirs("static", exist_ok=True)
app.mount("/dashboard", StaticFiles(directory="static", html=True), name="static")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TelemetryPayload(BaseModel):
    zone_id: int
    pressure_bar: float
    flow_lpm: float

@app.post("/api/telemetry")
def receive_telemetry(payload: TelemetryPayload, db: Session = Depends(get_db)):
    # 1. AI Inference Pipeline
    anomaly = detector.is_leak(payload.pressure_bar, payload.flow_lpm)
    
    # 2. Store reading in DB
    reading = SensorReading(
        zone_id=payload.zone_id,
        pressure_bar=payload.pressure_bar,
        flow_lpm=payload.flow_lpm,
        is_anomaly=bool(anomaly)
    )
    db.add(reading)
    
    # 3. Decision Control Logic: If leak detected, auto-close valve
    if anomaly:
        valve = db.query(SmartValve).filter(SmartValve.zone_id == payload.zone_id).first()
        if valve and valve.status == "OPEN":
            valve.status = "CLOSED"
            db.add(valve)
            
    db.commit()
    return {"status": "ok", "anomaly": bool(anomaly)}

@app.get("/api/dashboard_data")
def get_dashboard_data(db: Session = Depends(get_db)):
    # Limit queries to keep JSON response light
    recent = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(150).all()
    valves = db.query(SmartValve).all()
    
    return {
        "readings": [
            {"zone": r.zone_id, "pressure": r.pressure_bar, "flow": r.flow_lpm, "anomaly": r.is_anomaly, "time": r.timestamp.isoformat()}
            for r in recent
        ],
        "valves": [{"zone": v.zone_id, "status": v.status} for v in valves]
    }

@app.post("/api/valve/{zone_id}/toggle")
def toggle_valve(zone_id: int, db: Session = Depends(get_db)):
    valve = db.query(SmartValve).filter(SmartValve.zone_id == zone_id).first()
    if valve:
        valve.status = "OPEN" if valve.status == "CLOSED" else "CLOSED"
        db.commit()
        return {"status": valve.status}
    return {"error": "not found"}
