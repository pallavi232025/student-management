# 🎓 Student Management System - Microservices Architecture

A complete, production-grade **Student Management System** built using a decentralized **Microservices Architecture**. The system decouples Authentication, Student Records, and Course Catalog into independent microservices with dedicated SQLite databases, linked together via a centralized **FastAPI API Gateway** and a modern **React (Vite)** dashboard.

---

## 📌 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Project Folder Structure](#-project-folder-structure)
3. [Prerequisites & Node.js Installation Guide](#-prerequisites--nodejs-installation-guide)
4. [Backend Setup & Python Environment](#-backend-setup--python-environment)
5. [Environment Variables (.env)](#-environment-variables-env)
6. [Database Architecture](#-database-architecture)
7. [Running Backend Microservices](#-running-backend-microservices)
8. [Running the React Frontend](#-running-the-react-frontend)
9. [Swagger UI Interactive Documentation](#-swagger-ui-interactive-documentation)
10. [Postman API Testing Guide](#-postman-api-testing-guide)
11. [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## 🏗️ Architecture Overview

```
                      +-----------------------------+
                      |   React Frontend (Vite)     |
                      |   http://localhost:5173     |
                      +--------------+--------------+
                                     |
                                     |  HTTP REST (Bearer JWT)
                                     v
                      +-----------------------------+
                      |    FastAPI API Gateway      |
                      |    http://localhost:8000    |
                      +--------------+--------------+
                                     |
            +------------------------+------------------------+
            |                        |                        |
            v                        v                        v
+-----------------------+ +-----------------------+ +-----------------------+
|  Auth Microservice    | | Student Microservice  | |  Course Microservice  |
|  Port: 8001           | | Port: 8002            | |  Port: 8003           |
|  DB: auth.db          | | DB: students.db       | |  DB: courses.db       |
+-----------------------+ +-----------------------+ +-----------------------+
```

### Microservice Components:
- **API Gateway (`port 8000`)**: Single entry point for all frontend traffic. Handles reverse proxying, CORS policy, inter-service aggregation (Dashboard metrics), and unified error responses (HTTP 503 / 504 / 404).
- **Authentication Service (`port 8001`)**: Manages administrative user registration, password hashing using `bcrypt`, JWT access token issuance, and token verification.
- **Student Service (`port 8002`)**: Handles student profile CRUD operations, department filters, search querying, and duplicate email prevention.
- **Course Service (`port 8003`)**: Manages course catalogs, course codes, and student enrollment associations across independent databases.
- **React Frontend (`port 5173`)**: Single-page application built with React Router, Context API, responsive cards, modals, and toasts.

---

## 📁 Project Folder Structure

```
student-management/
│
├── api-gateway/                 # Central API Gateway
│   ├── main.py                  # Reverse proxy router & aggregator
│   └── requirements.txt         # Gateway dependencies
│
├── auth-service/                # Authentication Microservice
│   ├── app/
│   │   ├── main.py              # Auth routes & JWT generation
│   │   ├── models.py            # User SQLAlchemy model
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   └── database.py          # SQLite engine for auth.db
│   └── requirements.txt
│
├── student-service/             # Student Microservice
│   ├── app/
│   │   ├── main.py              # Student CRUD endpoints
│   │   ├── models.py            # Student SQLAlchemy model
│   │   ├── schemas.py           # Validation schemas
│   │   └── database.py          # SQLite engine for students.db
│   └── requirements.txt
│
├── course-service/              # Course Microservice
│   ├── app/
│   │   ├── main.py              # Course CRUD & enrollment endpoints
│   │   ├── models.py            # Course & Enrollment SQLAlchemy models
│   │   ├── schemas.py           # Course/Enrollment schemas
│   │   └── database.py          # SQLite engine for courses.db
│   └── requirements.txt
│
├── frontend/                    # Modern React Single Page Application
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, Modal, Toast, StatsCard
│   │   ├── context/             # AuthContext (JWT management)
│   │   ├── pages/               # Login, Register, Dashboard, Students, Courses, Enrollments
│   │   ├── services/            # Centralized API service (api.js)
│   │   ├── App.jsx              # Routes & navigation structure
│   │   ├── main.jsx             # React DOM root entry
│   │   └── index.css            # Custom CSS design system
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env                     # VITE_API_BASE_URL=http://localhost:8000
│
├── postman/
│   └── collection.json          # Preconfigured Postman Collection v2.1
│
├── run_all_services.py          # One-command Python launcher for all backend services
├── start_services.bat           # One-click Windows batch launcher
├── test_backend.py              # Unit & integration test suite
├── test_gateway.py              # API Gateway test suite
├── .env.example                 # Example configuration
├── .gitignore                   # Ignore rules for Python, Node, DBs
└── README.md                    # Project documentation
```

---

## ⚡ Prerequisites & Node.js Installation Guide

### 1. Python (Required for Backend Microservices)
- **Python 3.10+** (Python 3.12 is already configured and verified in this workspace).
- Check your Python version:
  ```bash
  python --version
  ```

### 2. Node.js & npm (Required for React Frontend)
If Node.js and npm are not yet installed on your machine, follow these safe, official steps:

1. **Download Node.js**:
   - Go to the official Node.js website: [https://nodejs.org](https://nodejs.org)
   - Click the button for **LTS (Long Term Support)** (recommended for most users).
2. **Run the Installer**:
   - Double-click the downloaded `.msi` file.
   - Follow the Setup Wizard steps (click **Next**, accept the license terms, choose the default destination folder, and click **Next**).
   - Ensure the checkbox for **"Add to PATH"** is selected (it is checked by default).
   - Click **Install** and then **Finish**.
3. **Verify the Installation**:
   - Open a fresh PowerShell or Command Prompt terminal and run:
     ```bash
     node -v
     npm -v
     ```
   - Both commands will display their version numbers (e.g., `v20.x.x` or `v22.x.x` and `npm 10.x.x`).

---

## 🛠️ Backend Setup & Python Environment

The Python virtual environment (`.venv`) is already created and all dependencies are installed. If you ever need to set it up from scratch:

```bash
# 1. Create the virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows Command Prompt:
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# 3. Install backend dependencies
pip install -r auth-service/requirements.txt
pip install -r student-service/requirements.txt
pip install -r course-service/requirements.txt
pip install -r api-gateway/requirements.txt
```

---

## 🔐 Environment Variables (.env)

The root `.env` file contains settings for the services:

```ini
# Security & JWT Token
JWT_SECRET_KEY=supersecretjwtkey_change_in_production_min32chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Service Ports
GATEWAY_PORT=8000
AUTH_SERVICE_PORT=8001
STUDENT_SERVICE_PORT=8002
COURSE_SERVICE_PORT=8003
FRONTEND_PORT=5173

# Internal Service Routing URLs
AUTH_SERVICE_URL=http://localhost:8001
STUDENT_SERVICE_URL=http://localhost:8002
COURSE_SERVICE_URL=http://localhost:8003

# Database URLs
AUTH_DATABASE_URL=sqlite:///./auth.db
STUDENT_DATABASE_URL=sqlite:///./students.db
COURSE_DATABASE_URL=sqlite:///./courses.db
```

---

## 💾 Database Architecture

Each microservice maintains strict data isolation with its own independent SQLite database file:

| Microservice | Database File | Tables | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth Service** | `auth.db` | `users` | User accounts, credentials (bcrypt hashes), roles |
| **Student Service** | `students.db` | `students` | Student details (ID, name, email, phone, department, major) |
| **Course Service** | `courses.db` | `courses`, `enrollments` | Course catalog and student-course associations |

> **Note on Cross-Service Relationships:** Because SQLite foreign keys cannot span multiple distinct database files, student enrollments are managed through service-level associations in `courses.db`. When enrolling, the Course Service queries the Student Service to verify identity and cache student details.

---

## 🚀 Running Backend Microservices

You can start all microservices with a single command, or start each in its own terminal.

### Option A: Start All Services Together (Recommended)

Run the orchestration script:
```bash
python run_all_services.py
```
*Or double-click `start_services.bat` on Windows.*

### Option B: Start Each Microservice in Separate Terminals

**Terminal 1 — Auth Service (Port 8001):**
```bash
cd auth-service
..\.venv\Scripts\uvicorn.exe app.main:app --port 8001 --reload
```

**Terminal 2 — Student Service (Port 8002):**
```bash
cd student-service
..\.venv\Scripts\uvicorn.exe app.main:app --port 8002 --reload
```

**Terminal 3 — Course Service (Port 8003):**
```bash
cd course-service
..\.venv\Scripts\uvicorn.exe app.main:app --port 8003 --reload
```

**Terminal 4 — API Gateway (Port 8000):**
```bash
cd api-gateway
..\.venv\Scripts\uvicorn.exe main:app --port 8000 --reload
```

---

## 💻 Running the React Frontend

Once Node.js is installed on your computer:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install frontend packages
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

### Pre-configured Administrator Credentials
- **Email:** `admin@example.com`
- **Password:** `admin123456`
*(You can also use the "Quick Fill Demo Credentials" button on the Login page!)*

---

## 📖 Swagger UI Interactive Documentation

Every FastAPI microservice and the API Gateway exposes an interactive OpenAPI Swagger UI:

| Service | Swagger URL | Direct Port |
| :--- | :--- | :--- |
| **API Gateway** | [http://localhost:8000/docs](http://localhost:8000/docs) | 8000 |
| **Auth Service** | [http://localhost:8001/docs](http://localhost:8001/docs) | 8001 |
| **Student Service** | [http://localhost:8002/docs](http://localhost:8002/docs) | 8002 |
| **Course Service** | [http://localhost:8003/docs](http://localhost:8003/docs) | 8003 |

---

## 📬 Postman API Testing Guide

The Postman collection is located at [`postman/collection.json`](file:///c:/PYTHON%20DEVELOPER/pallavi/student-management/postman/collection.json).

### How to Import & Run:
1. Open **Postman**.
2. Click **Import** (top left).
3. Select or drag-and-drop the file: `postman/collection.json`.
4. Run the requests in order:
   - **1. Auth Service ➔ Register User**: Registers a new user.
   - **2. Auth Service ➔ Login User**: Logs in and **automatically captures the JWT token** into the `{{authToken}}` collection variable.
   - **3. Auth Service ➔ Get Current User**: Validates the Bearer token.
   - **4. Student Service ➔ Create / List / Update / Delete**: CRUD on student records.
   - **5. Course Service ➔ Create / List / Update / Delete**: CRUD on courses.
   - **6. Enrollments ➔ Enroll Student in Course**: Creates cross-service student-course enrollment.
   - **7. Gateway ➔ Health Check & Dashboard Stats**: Verifies reverse proxy routing and aggregation.

---

## 🧪 Automated Test Suites

Verify all services in a few seconds using the built-in test suites:

```bash
# Test Auth, Student, and Course Microservices
python test_backend.py

# Test API Gateway Routing & Graceful Error Handling
python test_gateway.py
```

---

## 🔧 Troubleshooting & Common Issues

### 1. `Node.js / npm not found`
- **Cause:** Node.js is not installed or not added to your system's `PATH`.
- **Solution:** Follow the [Node.js Installation Guide](#-prerequisites--nodejs-installation-guide) above, download the LTS version from [nodejs.org](https://nodejs.org), and reopen your terminal after installation.

### 2. `503 Service Unavailable` returned by API Gateway
- **Cause:** The API Gateway is running, but one of the downstream microservices (Auth, Student, or Course) has not been started.
- **Solution:** Verify that all 3 services are active on ports 8001, 8002, and 8003 using `python run_all_services.py` or check the health pill in the top right of the frontend navigation bar.

### 3. `401 Unauthorized` on API requests
- **Cause:** Missing or expired JWT access token.
- **Solution:** Log in again through the frontend UI (`/login`) or execute the **Login** request in Postman to generate a fresh token.

### 4. `Port already in use` error
- **Cause:** Another process is bound to port 8000, 8001, 8002, 8003, or 5173.
- **Solution:** Identify and stop the conflicting process, or change the port in `.env`.
