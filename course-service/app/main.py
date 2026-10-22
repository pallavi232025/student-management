import os
from typing import Optional, List
import httpx
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db, init_db
from app.models import Course, Enrollment
from app.schemas import (
    CourseCreate, CourseUpdate, CourseResponse,
    EnrollmentCreate, EnrollmentResponse, EnrolledStudentResponse
)

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretjwtkey_change_in_production_min32chars")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
STUDENT_SERVICE_URL = os.getenv("STUDENT_SERVICE_URL", "http://localhost:8002")

app = FastAPI(
    title="Course Microservice",
    description="Microservice managing course catalog and student course enrollments.",
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
            detail="Authorization token required to access course service.",
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
    return {"status": "ok", "service": "course-service"}


@app.get("/courses/stats/summary", tags=["Statistics"])
def get_course_stats(db: Session = Depends(get_db)):
    """
    Internal endpoint for dashboard KPI stats.
    """
    total_courses = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()
    return {
        "total_courses": total_courses,
        "total_enrollments": total_enrollments
    }


@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, tags=["Courses"])
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Create a new course.
    Validates uniqueness of course code.
    """
    existing = db.query(Course).filter(Course.course_code == course_in.course_code.upper().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A course with code '{course_in.course_code.upper()}' already exists."
        )

    course = Course(
        course_name=course_in.course_name.strip(),
        course_code=course_in.course_code.upper().strip(),
        description=course_in.description.strip() if course_in.description else None
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    return CourseResponse(
        id=course.id,
        course_name=course.course_name,
        course_code=course.course_code,
        description=course.description,
        created_at=course.created_at,
        updated_at=course.updated_at,
        enrolled_count=0
    )


@app.get("/courses", response_model=List[CourseResponse], tags=["Courses"])
def get_courses(
    search: Optional[str] = Query(None, description="Search course name or course code"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Retrieve all courses with optional search and enrollment counts.
    """
    query = db.query(Course)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Course.course_name.ilike(search_pattern),
                Course.course_code.ilike(search_pattern),
                Course.description.ilike(search_pattern)
            )
        )

    courses = query.order_by(Course.id.desc()).offset(skip).limit(limit).all()

    response = []
    for c in courses:
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        response.append(
            CourseResponse(
                id=c.id,
                course_name=c.course_name,
                course_code=c.course_code,
                description=c.description,
                created_at=c.created_at,
                updated_at=c.updated_at,
                enrolled_count=enrolled_count
            )
        )
    return response


@app.get("/courses/{course_id}", response_model=CourseResponse, tags=["Courses"])
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Retrieve details of a single course by ID.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found."
        )

    enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
    return CourseResponse(
        id=course.id,
        course_name=course.course_name,
        course_code=course.course_code,
        description=course.description,
        created_at=course.created_at,
        updated_at=course.updated_at,
        enrolled_count=enrolled_count
    )


@app.put("/courses/{course_id}", response_model=CourseResponse, tags=["Courses"])
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Update an existing course by ID.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found."
        )

    if course_in.course_code and course_in.course_code.upper().strip() != course.course_code:
        conflict = db.query(Course).filter(
            Course.course_code == course_in.course_code.upper().strip()
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Course code '{course_in.course_code.upper()}' is already in use."
            )
        course.course_code = course_in.course_code.upper().strip()

    if course_in.course_name is not None:
        course.course_name = course_in.course_name.strip()
    if course_in.description is not None:
        course.description = course_in.description.strip()

    db.commit()
    db.refresh(course)

    enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
    return CourseResponse(
        id=course.id,
        course_name=course.course_name,
        course_code=course.course_code,
        description=course.description,
        created_at=course.created_at,
        updated_at=course.updated_at,
        enrolled_count=enrolled_count
    )


@app.delete("/courses/{course_id}", status_code=status.HTTP_200_OK, tags=["Courses"])
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Safely delete a course and its associated student enrollments.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found."
        )

    # Clean up associated enrollments
    db.query(Enrollment).filter(Enrollment.course_id == course_id).delete()
    db.delete(course)
    db.commit()

    return {"message": f"Course '{course.course_name}' and all associated enrollments deleted successfully."}


@app.post("/courses/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED, tags=["Enrollments"])
async def enroll_student(
    course_id: int,
    enroll_in: EnrollmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Enroll a student into a course.
    Queries Student Service if student metadata is missing, and prevents duplicate enrollment.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found."
        )

    # Check if student is already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == enroll_in.student_id
    ).first()
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student ID {enroll_in.student_id} is already enrolled in course {course.course_code}."
        )

    student_name = enroll_in.student_name
    student_email = enroll_in.student_email

    # Optionally fetch student info from student microservice
    if not student_name or not student_email:
        auth_header = request.headers.get("Authorization")
        headers = {"Authorization": auth_header} if auth_header else {}
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{STUDENT_SERVICE_URL}/students/{enroll_in.student_id}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    student_name = student_name or data.get("name")
                    student_email = student_email or data.get("email")
                elif res.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Student with ID {enroll_in.student_id} was not found in Student Service."
                    )
        except httpx.RequestError:
            # If student service is temporarily unreachable, proceed with available data
            pass

    enrollment = Enrollment(
        course_id=course.id,
        student_id=enroll_in.student_id,
        student_name=student_name or f"Student #{enroll_in.student_id}",
        student_email=student_email or ""
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return EnrollmentResponse(
        id=enrollment.id,
        course_id=course.id,
        student_id=enrollment.student_id,
        student_name=enrollment.student_name,
        student_email=enrollment.student_email,
        enrolled_at=enrollment.enrolled_at,
        course_name=course.course_name,
        course_code=course.course_code
    )


@app.get("/courses/{course_id}/students", response_model=List[EnrolledStudentResponse], tags=["Enrollments"])
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Retrieve all students enrolled in a particular course.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found."
        )

    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).order_by(Enrollment.enrolled_at.desc()).all()
    return [
        EnrolledStudentResponse(
            enrollment_id=e.id,
            student_id=e.student_id,
            student_name=e.student_name,
            student_email=e.student_email,
            enrolled_at=e.enrolled_at
        )
        for e in enrollments
    ]


@app.get("/courses/enrollments/student/{student_id}", response_model=List[EnrollmentResponse], tags=["Enrollments"])
def get_student_courses(
    student_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Retrieve all courses that a specific student is currently enrolled in.
    """
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    results = []
    for e in enrollments:
        course = db.query(Course).filter(Course.id == e.course_id).first()
        results.append(
            EnrollmentResponse(
                id=e.id,
                course_id=e.course_id,
                student_id=e.student_id,
                student_name=e.student_name,
                student_email=e.student_email,
                enrolled_at=e.enrolled_at,
                course_name=course.course_name if course else "Unknown",
                course_code=course.course_code if course else "Unknown"
            )
        )
    return results


@app.delete("/courses/{course_id}/enroll/{student_id}", status_code=status.HTTP_200_OK, tags=["Enrollments"])
def unenroll_student(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(verify_token)
):
    """
    Unenroll a student from a course.
    """
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == student_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment record not found for student {student_id} in course {course_id}."
        )

    db.delete(enrollment)
    db.commit()
    return {"message": f"Student {student_id} successfully unenrolled from course {course_id}."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8003, reload=True)
