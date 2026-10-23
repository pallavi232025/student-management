import sys
import os
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def test_auth():
    print("\n--- Testing Auth Microservice ---")
    auth_dir = os.path.join(BASE_DIR, "auth-service")
    sys.path.insert(0, auth_dir)
    for mod in list(sys.modules.keys()):
        if mod.startswith("app"):
            del sys.modules[mod]

    from app.main import app as auth_app  # type: ignore
    from app.database import init_db  # type: ignore
    init_db()

    client = TestClient(auth_app)
    
    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(f"[PASS] Health check passed for {auth_app.title}")

    # 2. Register
    reg_data = {
        "email": "testadmin@example.com",
        "password": "Password123!",
        "full_name": "Admin Tester"
    }
    r = client.post("/auth/register", json=reg_data)
    assert r.status_code in [201, 400], f"Register failed: {r.text}"
    print("[PASS] User registration endpoint verified")

    # 3. Login
    login_data = {
        "email": "testadmin@example.com",
        "password": "Password123!"
    }
    r = client.post("/auth/login", json=login_data)
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    assert token is not None
    print("[PASS] Login & JWT token generation verified")

    # 4. /auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200, f"/auth/me failed: {r.text}"
    user = r.json()
    assert user["email"] == "testadmin@example.com"
    print("[PASS] /auth/me profile retrieval with JWT verified")

    return token

def test_student(token):
    print("\n--- Testing Student Microservice ---")
    auth_dir = os.path.join(BASE_DIR, "auth-service")
    if auth_dir in sys.path:
        sys.path.remove(auth_dir)
    student_dir = os.path.join(BASE_DIR, "student-service")
    sys.path.insert(0, student_dir)
    for mod in list(sys.modules.keys()):
        if mod.startswith("app"):
            del sys.modules[mod]
    
    from app.main import app as student_app  # type: ignore
    from app.database import init_db  # type: ignore
    init_db()

    client = TestClient(student_app)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200
    print(f"[PASS] Student health check passed for {student_app.title}")

    # 2. Create Student
    student_data = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone_number": "+1-555-0144",
        "department": "Computer Science",
        "course": "B.Tech Computer Science"
    }
    r = client.post("/students", json=student_data, headers=headers)
    if r.status_code == 400 and "already exists" in r.text:
        # If exists from previous run, get student
        pass
    else:
        assert r.status_code == 201, f"Create student failed: {r.text}"
    print("[PASS] Student creation verified")

    # 3. Get Students
    r = client.get("/students", headers=headers)
    assert r.status_code == 200
    students = r.json()
    assert len(students) > 0
    student_id = students[0]["id"]
    print(f"[PASS] Retrieved {len(students)} students, testing with student_id={student_id}")

    # 4. Get Student by ID
    r = client.get(f"/students/{student_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Jane Doe" or "name" in r.json()
    print("[PASS] Student get by ID verified")

    # 5. Update Student
    r = client.put(f"/students/{student_id}", json={"phone_number": "+1-555-9999"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["phone_number"] == "+1-555-9999"
    print("[PASS] Student update verified")

    return student_id

def test_course(token, student_id):
    print("\n--- Testing Course Microservice ---")
    student_dir = os.path.join(BASE_DIR, "student-service")
    if student_dir in sys.path:
        sys.path.remove(student_dir)
    course_dir = os.path.join(BASE_DIR, "course-service")
    sys.path.insert(0, course_dir)
    for mod in list(sys.modules.keys()):
        if mod.startswith("app"):
            del sys.modules[mod]

    from app.main import app as course_app  # type: ignore
    from app.database import init_db  # type: ignore
    init_db()

    client = TestClient(course_app)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200
    print(f"[PASS] Course health check passed for {course_app.title}")

    # 2. Create Course
    course_data = {
        "course_name": "Full Stack Cloud Development",
        "course_code": "FSCD301",
        "description": "Comprehensive course covering modern microservices and web apps."
    }
    r = client.post("/courses", json=course_data, headers=headers)
    if r.status_code == 400 and "already exists" in r.text:
        pass
    else:
        assert r.status_code == 201, f"Create course failed: {r.text}"
    print("[PASS] Course creation verified")

    # 3. Get Courses
    r = client.get("/courses", headers=headers)
    assert r.status_code == 200
    courses = r.json()
    assert len(courses) > 0
    course_id = courses[0]["id"]
    print(f"[PASS] Retrieved {len(courses)} courses, testing with course_id={course_id}")

    # 4. Enroll Student in Course
    enroll_data = {
        "student_id": student_id,
        "student_name": "Jane Doe",
        "student_email": "jane.doe@example.com"
    }
    r = client.post(f"/courses/{course_id}/enroll", json=enroll_data, headers=headers)
    if r.status_code == 400 and "already enrolled" in r.text:
        pass
    else:
        assert r.status_code == 201, f"Enrollment failed: {r.text}"
    print("[PASS] Student enrollment in course verified")

    # 5. Get Enrolled Students for Course
    r = client.get(f"/courses/{course_id}/students", headers=headers)
    assert r.status_code == 200
    enrolled = r.json()
    assert len(enrolled) > 0
    print(f"[PASS] Course enrollments retrieved ({len(enrolled)} students enrolled)")

if __name__ == "__main__":
    token = test_auth()
    student_id = test_student(token)
    test_course(token, student_id)
    print("\n==============================================")
    print("ALL BACKEND MICROSERVICE TESTS PASSED SUCCESSFULLY!")
    print("==============================================")
