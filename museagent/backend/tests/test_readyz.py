from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_readyz():
    client = TestClient(app)
    r = client.get("/readyz")
    assert r.status_code == 200
    assert r.json().get("ready") is True


