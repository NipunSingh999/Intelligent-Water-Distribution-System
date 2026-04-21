from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime

Base = declarative_base()

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, index=True)
    pressure_bar = Column(Float)
    flow_lpm = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_anomaly = Column(Boolean, default=False)

class SmartValve(Base):
    __tablename__ = "smart_valves"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, unique=True, index=True)
    status = Column(String, default="OPEN") # "OPEN" or "CLOSED"

# SQLite DB without requiring server installations
engine = create_engine("sqlite:///./iwds.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Initialize 5 virtual valves natively
    if db.query(SmartValve).count() == 0:
        for i in range(1, 6):
            valve = SmartValve(zone_id=i, status="OPEN")
            db.add(valve)
        db.commit()
    db.close()
