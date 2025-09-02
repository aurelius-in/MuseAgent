from fastapi.testclient import TestClient
from museagent.backend.app import app


def test_library_pagination_params():
    client = TestClient(app)
    r = client.get('/library?page=1&per_page=1')
    assert r.status_code == 200
    j = r.json()
    assert 'tracks' in j and 'page' in j and 'per_page' in j and 'total' in j


