from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_healthz():
    client = TestClient(app)
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_metrics_export():
    client = TestClient(app)
    r = client.get("/metrics")
    assert r.status_code == 200
    r2 = client.get("/export?fmt=json")
    assert r2.status_code == 200


