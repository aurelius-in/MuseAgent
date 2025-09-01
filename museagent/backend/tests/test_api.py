from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_healthz():
    client = TestClient(app)
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json().get("ok") is True


