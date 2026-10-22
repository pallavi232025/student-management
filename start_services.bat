@echo off
title Student Management System - Microservices
echo ========================================================
echo   Student Management System - Microservices Launcher
echo ========================================================
echo.
echo Activating virtual environment and starting services...
call .venv\Scripts\activate.bat
python run_all_services.py
pause
