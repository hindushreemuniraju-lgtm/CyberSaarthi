import uuid
import pytest
from backend.app import create_app
from backend.app.models.database import db_session

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['project'] == 'CyberSaarthi'

def test_full_senior_caretaker_alert_flow(client):
    uid = uuid.uuid4().hex[:8]
    senior_email = f"lakshmi_{uid}@cybersaarthi.org"
    caretaker_email = f"suresh_{uid}@cybersaarthi.org"

    # 1. Register Senior in Kannada
    senior_resp = client.post('/api/auth/register', json={
        "name": "Lakshmi Test",
        "email": senior_email,
        "password": "Password123!",
        "user_mode": "senior",
        "preferred_language": "kn",
        "font_scale": "large",
        "voice_enabled": True
    })
    assert senior_resp.status_code == 201
    senior_token = senior_resp.get_json()['token']
    senior_id = senior_resp.get_json()['user']['id']

    # 2. Register Caretaker
    ct_resp = client.post('/api/auth/register', json={
        "name": "Suresh Test",
        "email": caretaker_email,
        "password": "Password123!",
        "user_mode": "caretaker",
        "preferred_language": "en"
    })
    assert ct_resp.status_code == 201
    ct_token = ct_resp.get_json()['token']
    ct_id = ct_resp.get_json()['user']['id']

    # 3. Senior requests Suresh as Caretaker
    req_resp = client.post('/api/caretaker/request', 
        headers={"Authorization": f"Bearer {senior_token}"},
        json={
            "identifier": caretaker_email,
            "alert_scope": "BLOCK_ONLY"
        }
    )
    assert req_resp.status_code == 201
    rel_id = req_resp.get_json()['relationship']['id']

    # 4. Caretaker activates / confirms relationship
    consent_resp = client.post('/api/caretaker/consent',
        headers={"Authorization": f"Bearer {ct_token}"},
        json={
            "relationship_id": rel_id,
            "status": "ACTIVE",
            "alert_scope": "BLOCK_ONLY"
        }
    )
    assert consent_resp.status_code == 200
    assert consent_resp.get_json()['relationship']['status'] == 'ACTIVE'

    # 5. Senior scans a suspicious bank link
    scan_resp = client.post('/api/scan',
        headers={"Authorization": f"Bearer {senior_token}"},
        json={
            "content": "http://sbi-kyc-update-portal.xyz/verify-login",
            "user_mode": "senior",
            "language": "kn"
        }
    )
    assert scan_resp.status_code == 200
    scan_data = scan_resp.get_json()
    assert scan_data['risk_level'] == 'BLOCK'
    assert scan_data['language'] == 'kn'
    assert 'ಅಪಾಯ' in scan_data['headline']

    # 6. Caretaker checks alerts - an alert should have been automatically generated!
    alerts_resp = client.get('/api/alerts', headers={"Authorization": f"Bearer {ct_token}"})
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.get_json()['alerts']
    assert len(alerts) >= 1
    recent_alert = alerts[0]
    assert "Lakshmi Test" in recent_alert['title']
    assert recent_alert['status'] == 'UNREAD'
