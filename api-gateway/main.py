import os
from typing import Optional
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment configuration
load_dotenv()

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001").rstrip("/")
STUDENT_SERVICE_URL = os.getenv("STUDENT_SERVICE_URL", "http://localhost:8002").rstrip("/")
COURSE_SERVICE_URL = os.getenv("COURSE_SERVICE_URL", "http://localhost:8003").rstrip("/")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", "8000"))

app = FastAPI(
    title="API Gateway - Student Management System",
    description="Central reverse-proxy API Gateway routing requests to Auth, Student, and Course microservices.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP client timeout in seconds
TIMEOUT = 10.0


async def forward_request(target_url: str, request: Request, service_name: str) -> Response:
    """
    Reverse proxy helper that forwards client requests to the destination microservice,
    forwarding method, query parameters, headers, and request body.
    Handles timeouts, connection errors, and downstream HTTP exceptions.
    """
    body = await request.body()
    headers = dict(request.headers)
    # Remove 'host' header to allow httpx to populate it properly for the target
    headers.pop("host", None)
    headers.pop("content-length", None)

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.request(
                method=request.method,
                url=target_url,
                params=dict(request.query_params),
                content=body,
                headers=headers
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.headers.get("content-type")
            )
    except httpx.ConnectError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": f"{service_name} is currently unreachable. Please make sure the service is running.",
                "target_url": target_url,
                "status": "service_unavailable"
            }
        )
    except httpx.TimeoutException:
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={
                "detail": f"{service_name} request timed out after {TIMEOUT} seconds.",
                "target_url": target_url,
                "status": "gateway_timeout"
            }
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "detail": f"An error occurred while communicating with {service_name}: {str(exc)}",
                "status": "bad_gateway"
            }
        )


@app.get("/health", tags=["Gateway Health"])
async def gateway_health():
    """
    Gateway health check endpoint that also probes all downstream microservices.
    """
    services_status = {}
    async with httpx.AsyncClient(timeout=3.0) as client:
        # Check Auth Service
        try:
            r = await client.get(f"{AUTH_SERVICE_URL}/health")
            services_status["auth_service"] = "online" if r.status_code == 200 else "degraded"
        except Exception:
            services_status["auth_service"] = "offline"

        # Check Student Service
        try:
            r = await client.get(f"{STUDENT_SERVICE_URL}/health")
            services_status["student_service"] = "online" if r.status_code == 200 else "degraded"
        except Exception:
            services_status["student_service"] = "offline"

        # Check Course Service
        try:
            r = await client.get(f"{COURSE_SERVICE_URL}/health")
            services_status["course_service"] = "online" if r.status_code == 200 else "degraded"
        except Exception:
            services_status["course_service"] = "offline"

    all_online = all(status == "online" for status in services_status.values())
    return {
        "gateway": "online",
        "overall_status": "healthy" if all_online else "partially_available",
        "services": services_status
    }


@app.get("/api/dashboard/stats", tags=["Dashboard"])
async def get_dashboard_stats(request: Request):
    """
    Aggregated dashboard endpoint querying Student Service and Course Service.
    Returns total students, total courses, total enrollments, and recent student records.
    """
    headers = {"Authorization": request.headers.get("Authorization", "")}
    total_students = 0
    recent_students = []
    total_courses = 0
    total_enrollments = 0

    async with httpx.AsyncClient(timeout=4.0) as client:
        # Query Student Service Stats
        try:
            res_student = await client.get(f"{STUDENT_SERVICE_URL}/students/stats/summary", headers=headers)
            if res_student.status_code == 200:
                sdata = res_student.json()
                total_students = sdata.get("total_students", 0)
                recent_students = sdata.get("recent_students", [])
        except Exception:
            pass

        # Query Course Service Stats
        try:
            res_course = await client.get(f"{COURSE_SERVICE_URL}/courses/stats/summary", headers=headers)
            if res_course.status_code == 200:
                cdata = res_course.json()
                total_courses = cdata.get("total_courses", 0)
                total_enrollments = cdata.get("total_enrollments", 0)
        except Exception:
            pass

    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "recent_students": recent_students
    }


# =========================================================================
# Route: Authentication Service Forwarding (/auth/*)
# =========================================================================
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"], tags=["Authentication Proxy"])
async def auth_proxy(path: str, request: Request):
    target = f"{AUTH_SERVICE_URL}/auth/{path}"
    return await forward_request(target, request, "Authentication Service")


# =========================================================================
# Route: Student Service Forwarding (/students, /students/*)
# =========================================================================
@app.api_route("/students", methods=["GET", "POST", "OPTIONS"], tags=["Students Proxy"])
async def students_root_proxy(request: Request):
    target = f"{STUDENT_SERVICE_URL}/students"
    return await forward_request(target, request, "Student Service")


@app.api_route("/students/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"], tags=["Students Proxy"])
async def students_path_proxy(path: str, request: Request):
    target = f"{STUDENT_SERVICE_URL}/students/{path}"
    return await forward_request(target, request, "Student Service")


# =========================================================================
# Route: Course Service Forwarding (/courses, /courses/*)
# =========================================================================
@app.api_route("/courses", methods=["GET", "POST", "OPTIONS"], tags=["Courses Proxy"])
async def courses_root_proxy(request: Request):
    target = f"{COURSE_SERVICE_URL}/courses"
    return await forward_request(target, request, "Course Service")


@app.api_route("/courses/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"], tags=["Courses Proxy"])
async def courses_path_proxy(path: str, request: Request):
    target = f"{COURSE_SERVICE_URL}/courses/{path}"
    return await forward_request(target, request, "Course Service")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=GATEWAY_PORT, reload=True)
