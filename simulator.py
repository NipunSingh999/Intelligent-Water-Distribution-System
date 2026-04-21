import time
import random
import requests
import threading
import os

PORT = os.environ.get("PORT", 8000)
API_URL = f"http://127.0.0.1:{PORT}/api/telemetry"

def simulate_zone(zone_id: int):
    while True:
        # 1. Normal state generation
        pressure = random.uniform(48.0, 52.0)
        flow = random.uniform(95.0, 105.0)
        
        # 2. Inject Mock Leak Anomaly (2% probability)
        # This will trigger the AI to shut the valve!
        if random.random() < 0.02:
            print(f"[!] --- INJECTING LEAK at Zone {zone_id} ---")
            pressure = random.uniform(5.0, 15.0)  # Huge pressure drop
            flow = random.uniform(180.0, 210.0)   # Huge flow surge
            
        payload = {
            "zone_id": zone_id,
            "pressure_bar": round(pressure, 2),
            "flow_lpm": round(flow, 2)
        }
        
        # 3. Post to API
        try:
            requests.post(API_URL, json=payload, timeout=2)
            print(f"Sent Z{zone_id}: P={payload['pressure_bar']} F={payload['flow_lpm']}")
        except Exception:
            pass # Server might be down
            
        # Emit 1 reading per second
        time.sleep(1)

def run_simulator():
    print("Starting Digital Twin Data Emulator within Backend...")
    for i in range(1, 6): # 5 zones
        threading.Thread(target=simulate_zone, args=(i,), daemon=True).start()

if __name__ == "__main__":
    run_simulator()
    try:
        while True:
            time.sleep(100)
    except KeyboardInterrupt:
        print("Simulator stopped.")
