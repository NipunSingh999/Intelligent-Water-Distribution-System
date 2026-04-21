@echo off
echo Starting IWDS Digital Twin...
cd /d "%~dp0"
call venv\Scripts\activate
start "Digital Twin Backend Core" cmd /k "uvicorn backend:app --host 0.0.0.0 --port 8000"
timeout /t 3 >nul
start "IoT Emulator Script" cmd /k "python simulator.py"
echo ----------------------------------------------------
echo Backend and Simulator are running in separate windows.
echo Dashboard is available at: http://localhost:8000/dashboard/
echo ----------------------------------------------------
start http://localhost:8000/dashboard/
