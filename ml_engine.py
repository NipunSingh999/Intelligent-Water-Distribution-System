import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np

class AnomalyDetector:
    def __init__(self):
        # We use an Isolation Forest to detect outlier payloads
        self.model = IsolationForest(contamination=0.05, random_state=42)
        
        # Train baseline "Normal" data
        normal_data = pd.DataFrame({
            'pressure': np.random.normal(50, 2, 500),  # Baseline normal pressure ~50 bar
            'flow': np.random.normal(100, 5, 500)     # Baseline normal flow ~100 LPM
        })
        self.model.fit(normal_data)

    def is_leak(self, pressure, flow):
        # returns True if outlier detected
        prediction = self.model.predict([[pressure, flow]])
        return prediction[0] == -1
