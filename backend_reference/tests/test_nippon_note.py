import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
CREDS = {"email": "editor@nipponnote.id", "password": "NipponDemo2026!"}


def test_content_all_is_json_and_serializable():
    response = requests.get(f"{BASE_URL}/api/content/all", timeout=20)
    assert response.status_code == 200
    data = response.json()
    assert {"articles", "anime", "destinations", "words", "artists"} <= set(data)
    assert all("_id" not in item for values in data.values() for item in values)


def test_content_collection_and_invalid_collection():
    response = requests.get(f"{BASE_URL}/api/content/articles", timeout=20)
    assert response.status_code == 200 and response.json()[0]["slug"] == "tokyo-konbini"
    assert requests.get(f"{BASE_URL}/api/content/nope", timeout=20).status_code == 404


def test_auth_cookie_me_and_logout():
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json=CREDS, timeout=20)
    assert response.status_code == 200
    assert response.json()["role"] == "admin"
    assert "access_token" in response.cookies and "HttpOnly" in response.headers.get("set-cookie", "")
    me = session.get(f"{BASE_URL}/api/auth/me", timeout=20)
    assert me.status_code == 200 and me.json()["email"] == CREDS["email"]
    assert session.post(f"{BASE_URL}/api/auth/logout", timeout=20).status_code == 200


def test_protected_crud_create_and_delete():
    session = requests.Session()
    assert session.post(f"{BASE_URL}/api/auth/login", json=CREDS, timeout=20).status_code == 200
    payload = {"data": {"id": "TEST_review_item", "title": "TEST Review Item", "slug": "test-review-item"}}
    created = session.post(f"{BASE_URL}/api/admin/articles", json=payload, timeout=20)
    assert created.status_code == 200 and created.json()["id"] == "TEST_review_item"
    assert session.delete(f"{BASE_URL}/api/admin/articles/TEST_review_item", timeout=20).status_code == 200