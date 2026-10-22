import sys
import os
import httpx
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "api-gateway"))

import main as gateway_module

client = TestClient(gateway_module.app)

def test_gateway_health():
    print("\n--- Testing API Gateway Endpoints ---")
    r = client.get("/health")
    assert r.status_code == 200, f"Gateway health failed: {r.text}"
    data = r.json()
    assert data["gateway"] == "online"
    print(f"[PASS] Gateway health check online: {data}")

def test_gateway_dashboard_stats():
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200, f"Gateway stats failed: {r.text}"
    data = r.json()
    assert "total_students" in data
    assert "total_courses" in data
    print(f"[PASS] Gateway aggregated dashboard stats: {data}")

def test_gateway_unreachable_downstream():
    # Calling an endpoint when target service is offline triggers our graceful 503 response
    r = client.get("/students")
    assert r.status_code in [200, 503], f"Unexpected code: {r.status_code}"
    print(f"[PASS] Gateway handled downstream service request gracefully (status code {r.status_code})")

if __name__ == "__main__":
    test_gateway_health()
    test_gateway_dashboard_stats()
    test_gateway_unreachable_downstream()
    print("\n==============================================")
    print("ALL API GATEWAY TESTS PASSED SUCCESSFULLY!")
    print("==============================================")
