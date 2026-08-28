from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_and_user_transaction_flow() -> None:
    # 1. Signup User A
    signup_payload_a = {
        "email": "user_a@example.com",
        "password": "secretpassword123",
        "full_name": "User Alice",
    }
    res_signup_a = client.post("/api/v1/auth/signup", json=signup_payload_a)
    assert res_signup_a.status_code == 201
    user_a_data = res_signup_a.json()
    assert user_a_data["email"] == "user_a@example.com"
    assert "id" in user_a_data

    # 2. Signup Duplicate Email (Should fail 400)
    res_duplicate = client.post("/api/v1/auth/signup", json=signup_payload_a)
    assert res_duplicate.status_code == 400

    # 3. Login User A
    login_payload_a = {
        "email": "user_a@example.com",
        "password": "secretpassword123",
    }
    res_login_a = client.post("/api/v1/auth/login", json=login_payload_a)
    assert res_login_a.status_code == 200
    token_a = res_login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Verify HttpOnly cookie was set
    assert "refresh_token" in res_login_a.cookies

    # 4. Get Current User Profile (/me)
    res_me = client.get("/api/v1/auth/me", headers=headers_a)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "user_a@example.com"

    # 5. Create Transaction for User A
    tx_payload_a = {
        "merchant": "Target",
        "amount": 49.99,
        "currency": "USD",
        "category": "Shopping",
        "payment_method": "Credit Card",
    }
    res_tx_a = client.post("/api/v1/transactions/", json=tx_payload_a, headers=headers_a)
    assert res_tx_a.status_code == 201
    tx_a_id = res_tx_a.json()["id"]

    # 6. Signup & Login User B
    signup_payload_b = {
        "email": "user_b@example.com",
        "password": "secretpassword123",
        "full_name": "User Bob",
    }
    client.post("/api/v1/auth/signup", json=signup_payload_b)
    res_login_b = client.post(
        "/api/v1/auth/login",
        json={"email": "user_b@example.com", "password": "secretpassword123"},
    )
    token_b = res_login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 7. Verify User B CANNOT see User A's transaction
    res_list_b = client.get("/api/v1/transactions/", headers=headers_b)
    assert res_list_b.status_code == 200
    b_items = res_list_b.json()["items"]
    assert not any(item["id"] == tx_a_id for item in b_items)

    # 8. Verify User B CANNOT delete User A's transaction (Should return 404)
    res_delete = client.delete(f"/api/v1/transactions/{tx_a_id}", headers=headers_b)
    assert res_delete.status_code == 404

    # 9. Verify Token Refresh Flow
    refresh_cookie = res_login_a.cookies["refresh_token"]
    client.cookies.set("refresh_token", refresh_cookie)
    res_refresh = client.post("/api/v1/auth/refresh")
    assert res_refresh.status_code == 200
    assert "access_token" in res_refresh.json()

    # 10. Logout User A
    res_logout = client.post("/api/v1/auth/logout")
    assert res_logout.status_code == 200


def test_invalid_login() -> None:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"},
    )
    assert res.status_code == 401
