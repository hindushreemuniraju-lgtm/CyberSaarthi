@echo off
title CyberSaarthi - Digital Safety Companion
color 0A
echo ========================================================
echo       CyberSaarthi - Digital Safety Companion
echo       VTU Societal Project
echo ========================================================
echo.
echo Starting CyberSaarthi Unified Server on http://localhost:5050 ...
echo.

if not exist backend\venv (
    echo Virtual environment not found. Setting up...
    python -m venv backend\venv
    call backend\venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
)

start "" http://localhost:5050
.\backend\venv\Scripts\python.exe backend\run.py
pause
