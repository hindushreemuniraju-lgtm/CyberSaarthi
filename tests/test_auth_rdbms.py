import uuid
import pytest
from backend.app import create_app
from backend.app.models.database import db_session
from backend.app.models.user import User, Role, LoginHistory
from backend.app.models.relationship import CaretakerLink

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_registration_and_duplicate_prevention(client):
    suffix = uuid.uuid4().hex[:6]
    email = f"student_{suffix}@vtu.ac.in"
    username = f"student_{suffix}"

    # 1. Successful Registration
    res = client.post('/api/auth/register', json={
        "full_name": "Test Student",
        "email": email,
        "username": username,
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
        "role": "adult",
        "preferred_language": "en"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "token" in data
    assert data["user"]["email"] == email
    assert data["user"]["username"] == username
    assert data["user"]["role"] == "adult"
    assert data["redirect_url"] == "/adult"

    # 2. Duplicate Email Prevention
    dup_email_res = client.post('/api/auth/register', json={
        "full_name": "Another Student",
        "email": email,
        "username": f"unique_{uuid.uuid4().hex[:6]}",
        "password": "StrongPassword123!",
        "role": "adult"
    })
    assert dup_email_res.status_code == 409
    assert "already exists" in dup_email_res.get_json()["error"]

    # 3. Duplicate Username Prevention
    dup_user_res = client.post('/api/auth/register', json={
        "full_name": "Another Student",
        "email": f"unique_{uuid.uuid4().hex[:6]}@vtu.ac.in",
        "username": username,
        "password": "StrongPassword123!",
        "role": "adult"
    })
    assert dup_user_res.status_code == 409
    assert "already taken" in dup_user_res.get_json()["error"]

def test_login_success_and_failures(client):
    suffix = uuid.uuid4().hex[:6]
    email = f"senior_{suffix}@cybersaarthi.org"
    username = f"senior_{suffix}"
    password = "SafeSeniorPass123!"

    # Register Senior
    reg_res = client.post('/api/auth/register', json={
        "full_name": "Senior Citizen",
        "email": email,
        "username": username,
        "password": password,
        "role": "senior",
        "preferred_language": "kn"
    })
    assert reg_res.status_code == 201

    # 1. Login with Email
    login_email_res = client.post('/api/auth/login', json={
        "identifier": email,
        "password": password
    })
    assert login_email_res.status_code == 200
    token = login_email_res.get_json()["token"]
    assert login_email_res.get_json()["role"] == "senior"
    assert login_email_res.get_json()["redirect_url"] == "/senior"

    # 2. Login with Username
    login_user_res = client.post('/api/auth/login', json={
        "identifier": username,
        "password": password
    })
    assert login_user_res.status_code == 200
    assert login_user_res.get_json()["user"]["username"] == username

    # 3. Incorrect Password Handling
    bad_pass_res = client.post('/api/auth/login', json={
        "identifier": username,
        "password": "WrongPassword999!"
    })
    assert bad_pass_res.status_code == 401
    assert "Invalid" in bad_pass_res.get_json()["error"]

    # 4. Unknown User Handling
    no_user_res = client.post('/api/auth/login', json={
        "identifier": "non_existent_user_xyz_999",
        "password": "AnyPassword123!"
    })
    assert no_user_res.status_code == 401

def test_role_based_access_control_and_verification(client):
    suffix = uuid.uuid4().hex[:6]
    kid_email = f"kid_{suffix}@cybersaarthi.org"
    caretaker_email = f"caretaker_{suffix}@cybersaarthi.org"
    pwd = "SecurePassword123!"

    # 1. Register Kid
    kid_res = client.post('/api/auth/register', json={
        "full_name": "Rohan Kid",
        "email": kid_email,
        "username": f"rohan_{suffix}",
        "password": pwd,
        "role": "kid"
    })
    kid_token = kid_res.get_json()["token"]
    kid_id = kid_res.get_json()["user"]["user_id"]

    # 2. Register Caretaker
    ct_res = client.post('/api/auth/register', json={
        "full_name": "Parent Caretaker",
        "email": caretaker_email,
        "username": f"parent_{suffix}",
        "password": pwd,
        "role": "caretaker"
    })
    ct_token = ct_res.get_json()["token"]
    ct_id = ct_res.get_json()["user"]["user_id"]

    # 3. Verify Kid cannot access Caretaker protected scans
    ward_scan_attempt = client.get(
        f'/api/caretaker/ward/{kid_id}/scans',
        headers={"Authorization": f"Bearer {kid_token}"}
    )
    assert ward_scan_attempt.status_code == 403
    assert "Access denied" in ward_scan_attempt.get_json()["error"]

    # 4. Verify Role Endpoint
    verify_kid_as_kid = client.post(
        '/api/auth/verify-role',
        headers={"Authorization": f"Bearer {kid_token}"},
        json={"target_role": "kid"}
    )
    assert verify_kid_as_kid.status_code == 200
    assert verify_kid_as_kid.get_json()["allowed"] is True

    verify_kid_as_caretaker = client.post(
        '/api/auth/verify-role',
        headers={"Authorization": f"Bearer {kid_token}"},
        json={"target_role": "caretaker"}
    )
    assert verify_kid_as_caretaker.status_code == 200
    assert verify_kid_as_caretaker.get_json()["allowed"] is False

def test_forgot_and_reset_password(client):
    suffix = uuid.uuid4().hex[:6]
    email = f"reset_user_{suffix}@cybersaarthi.org"
    username = f"reset_{suffix}"
    old_pwd = "OldPassword123!"
    new_pwd = "NewSecurePassword456!"

    client.post('/api/auth/register', json={
        "full_name": "Reset Test User",
        "email": email,
        "username": username,
        "password": old_pwd,
        "role": "adult"
    })

    # 1. Request Forgot Password
    forgot_res = client.post('/api/auth/forgot-password', json={
        "identifier": email
    })
    assert forgot_res.status_code == 200
    token = forgot_res.get_json()["reset_token"]
    assert token.startswith("reset_")

    # 2. Reset with Token
    reset_res = client.post('/api/auth/reset-password', json={
        "token": token,
        "new_password": new_pwd,
        "confirm_password": new_pwd
    })
    assert reset_res.status_code == 200
    assert "successfully" in reset_res.get_json()["message"]

    # 3. Old password should fail
    fail_old = client.post('/api/auth/login', json={
        "identifier": email,
        "password": old_pwd
    })
    assert fail_old.status_code == 401

    # 4. New password should succeed
    succ_new = client.post('/api/auth/login', json={
        "identifier": email,
        "password": new_pwd
    })
    assert succ_new.status_code == 200
