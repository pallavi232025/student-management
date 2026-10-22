import os
from typing import Optional, List
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db, init_db
from app.models import Student
from app.schemas import StudentCreate, StudentUpdate, StudentResponse

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretjwtkey_change_in_production_min32chars")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

app = FastAPI(
    title="Student Microservice",
    description="Microservice managing student profiles, records, and CRUD operations.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


@app.on_event("startup")
def startup_event():
    init_db()


def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    Validates JWT token for protected endpoints.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required to access student service.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "student-service"}


@app.get("/students/stats/summary", tags=["Statistics"])
def get_student_stats(db: Session = Depends(get_db)):
    """
    Internal endpoint to retrieve total student count and recent registrations.
    """
    total = db.query(Student).count()
    recent = db.query(Student).order_by(Student.id.desc()).limit(5).all()
    return {
        "total_students": total,
        "recent_students": [
            {
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "department": s.department,
                "course": s.course,
                "created_at": s.created_at
            }
            for s in recent
        ]
    }


@app.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED, tags=["Students"])
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Create a new student record.
    Prevents duplicate email registration.
    """
    existing = db.query(Student).filter(Student.email == student_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A student with email '{student_in.email}' already exists."
        )

    student = Student(
        name=student_in.name.strip(),
        email=student_in.email.lower().strip(),
        phone_number=student_in.phone_number.strip(),
        department=student_in.department.strip(),
        course=student_in.course.strip()
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@app.get("/students", response_model=List[StudentResponse], tags=["Students"])
def get_students(
    search: Optional[str] = Query(None, description="Search term matching name, email, or department"),
    department: Optional[str] = Query(None, description="Filter by department"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Retrieve all students with optional search query and department filter.
    """
    query = db.query(Student)

    if department:
        query = query.filter(Student.department == department)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_pattern),
                Student.email.ilike(search_pattern),
                Student.department.ilike(search_pattern),
                Student.course.ilike(search_pattern)
            )
        )

    students = query.order_by(Student.id.desc()).offset(skip).limit(limit).all()
    return students


@app.get("/students/{student_id}", response_model=StudentResponse, tags=["Students"])
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Retrieve a specific student by ID.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )
    return student


@app.put("/students/{student_id}", response_model=StudentResponse, tags=["Students"])
def update_student(
    student_id: int,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Update student details by ID.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )

    # Check email conflict if email is being changed
    if student_in.email and student_in.email.lower() != student.email:
        conflict = db.query(Student).filter(Student.email == student_in.email.lower()).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A student with email '{student_in.email}' already exists."
            )
        student.email = student_in.email.lower()

    if student_in.name is not None:
        student.name = student_in.name.strip()
    if student_in.phone_number is not None:
        student.phone_number = student_in.phone_number.strip()
    if student_in.department is not None:
        student.department = student_in.department.strip()
    if student_in.course is not None:
        student.course = student_in.course.strip()

    db.commit()
    db.refresh(student)
    return student


@app.delete("/students/{student_id}", status_code=status.HTTP_200_OK, tags=["Students"])
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Delete a student record by ID.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )

    db.delete(student)
    db.commit()
    return {"message": f"Student with ID {student_id} deleted successfully."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
