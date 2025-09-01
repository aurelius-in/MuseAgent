from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_library_shape():
    client = TestClient(app)
    r = client.get("/library")
    assert r.status_code == 200
    assert "tracks" in r.json()


