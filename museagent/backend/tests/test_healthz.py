from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_health():
    client = TestClient(app)
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["ok"] is True


