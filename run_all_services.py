"""
Microservices Orchestration Runner
Launches all backend services simultaneously:
- Auth Service (Port 8001)
- Student Service (Port 8002)
- Course Service (Port 8003)
- API Gateway (Port 8000)

Usage:
  python run_all_services.py
"""

import os
import sys
import time
import subprocess
import signal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_EXE = os.path.join(BASE_DIR, ".venv", "Scripts", "python.exe")

if not os.path.exists(PYTHON_EXE):
    PYTHON_EXE = sys.executable

SERVICES = [
    {
        "name": "Auth Service (:8001)",
        "cwd": os.path.join(BASE_DIR, "auth-service"),
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
    },
    {
        "name": "Student Service (:8002)",
        "cwd": os.path.join(BASE_DIR, "student-service"),
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"],
    },
    {
        "name": "Course Service (:8003)",
        "cwd": os.path.join(BASE_DIR, "course-service"),
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8003"],
    },
    {
        "name": "API Gateway (:8000)",
        "cwd": os.path.join(BASE_DIR, "api-gateway"),
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    },
]

def main():
    print("=" * 65)
    print("  STUDENT MANAGEMENT SYSTEM - STARTING ALL MICROSERVICES")
    print("=" * 65)
    print("API Gateway:     http://localhost:8000 (Swagger: /docs)")
    print("Auth Service:    http://localhost:8001 (Swagger: /docs)")
    print("Student Service: http://localhost:8002 (Swagger: /docs)")
    print("Course Service:  http://localhost:8003 (Swagger: /docs)")
    print("=" * 65)
    print("Press Ctrl+C to terminate all services safely.\n")

    processes = []

    try:
        for s in SERVICES:
            print(f"[*] Starting {s['name']}...")
            p = subprocess.Popen(
                s["cmd"],
                cwd=s["cwd"],
                stdout=None,
                stderr=None,
            )
            processes.append((s["name"], p))
            time.sleep(1)

        print("\n[+] All microservices are running!")
        while True:
            time.sleep(1)
            for name, p in processes:
                if p.poll() is not None:
                    print(f"[!] Warning: {name} terminated unexpectedly with code {p.returncode}")

    except KeyboardInterrupt:
        print("\n\nShutting down all microservices...")
        for name, p in processes:
            print(f"Stopping {name}...")
            p.terminate()
            try:
                p.wait(timeout=3)
            except subprocess.TimeoutExpired:
                p.kill()
        print("All microservices stopped.")

if __name__ == "__main__":
    main()
