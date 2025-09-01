from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_metrics_shape():
    client = TestClient(app)
    r = client.get("/metrics")
    assert r.status_code == 200
    data = r.json()
    assert "requests" in data and "latency_ms" in data


