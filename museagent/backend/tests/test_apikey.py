import os
from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_api_key_optional_allows_health():
    client = TestClient(app)
    r = client.get("/healthz")
    assert r.status_code == 200


