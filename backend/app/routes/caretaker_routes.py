from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.user import User
from backend.app.models.relationship import CaretakerLink, Consent
from backend.app.models.alert import Alert
from backend.app.models.scan_event import ScanEvent
from backend.app.utils.auth_helpers import token_required, role_required

caretaker_bp = Blueprint('caretaker', __name__)

@caretaker_bp.route('/people', methods=['GET'])
@token_required
def get_supported_people(current_user):
    # Returns wards for this caretaker
    relationships = db_session.query(CaretakerLink).filter(
        CaretakerLink.caretaker_user_id == current_user.user_id
    ).all()
    results = []
    for r in relationships:
        ward = r.linked_user
        if not ward:
            continue
        unread_alerts = db_session.query(Alert).filter_by(
            ward_id=ward.user_id,
            caretaker_id=current_user.user_id,
            status='UNREAD'
        ).count()
        last_scan = db_session.query(ScanEvent).filter_by(user_id=ward.user_id)\
            .order_by(ScanEvent.created_at.desc()).first()

        results.append({
            "relationship_id": r.link_id,
            "ward_id": ward.user_id,
            "ward_name": ward.full_name,
            "ward_mode": ward.user_mode,
            "ward_email": ward.email,
            "ward_phone": ward.phone,
            "status": r.consent_status,
            "alert_scope": r.alert_scope,
            "unread_alerts_count": unread_alerts,
            "last_activity": last_scan.created_at.isoformat() if last_scan else None,
            "last_risk_level": last_scan.risk_level if last_scan else "NONE"
        })

    return jsonify({"people": results}), 200

@caretaker_bp.route('/my-caretakers', methods=['GET'])
@token_required
def get_my_caretakers(current_user):
    # Returns caretakers for this ward (Senior / Kid)
    relationships = db_session.query(CaretakerLink).filter(
        CaretakerLink.linked_user_id == current_user.user_id
    ).all()
    results = []
    for r in relationships:
        caretaker = r.caretaker
        if not caretaker:
            continue
        results.append({
            "relationship_id": r.link_id,
            "caretaker_id": caretaker.user_id,
            "caretaker_name": caretaker.full_name,
            "caretaker_email": caretaker.email,
            "caretaker_phone": caretaker.phone,
            "status": r.consent_status,
            "alert_scope": r.alert_scope,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return jsonify({"caretakers": results}), 200

@caretaker_bp.route('/request', methods=['POST'])
@token_required
def request_relationship(current_user):
    data = request.get_json() or {}
    target_identifier = (data.get('identifier') or '').strip().lower()
    alert_scope = data.get('alert_scope', 'BLOCK_ONLY')
    notes = data.get('notes', '')

    if not target_identifier:
        return jsonify({'error': 'Please provide the email or username of the person you want to connect with.'}), 400

    target_user = None
    if '@' in target_identifier:
        target_user = db_session.query(User).filter_by(email=target_identifier).first()
    else:
        target_user = db_session.query(User).filter_by(username=target_identifier).first()
        if not target_user:
            target_user = db_session.query(User).filter_by(phone=target_identifier).first()
            if not target_user:
                target_user = db_session.query(User).filter_by(email=target_identifier).first()

    if not target_user:
        return jsonify({'error': 'No registered CyberSaarthi user found with this email or username.'}), 404

    if target_user.user_id == current_user.user_id:
        return jsonify({'error': 'You cannot link your own account as a caretaker or ward.'}), 400

    # Determine who is caretaker vs ward
    if current_user.user_mode == 'caretaker':
        caretaker_id = current_user.user_id
        ward_id = target_user.user_id
        init_status = 'PENDING'
    else:
        # Ward inviting a caretaker
        caretaker_id = target_user.user_id
        ward_id = current_user.user_id
        init_status = 'ACTIVE'

    # Check existing relationship
    existing = db_session.query(CaretakerLink).filter(
        CaretakerLink.caretaker_user_id == caretaker_id,
        CaretakerLink.linked_user_id == ward_id
    ).first()

    if existing:
        if existing.consent_status == 'ACTIVE':
            return jsonify({'message': 'This relationship is already active.', 'relationship': existing.to_dict()}), 200
        existing.consent_status = init_status
        existing.alert_scope = alert_scope
        existing.notes = notes
        db_session.commit()
        return jsonify({'message': 'Relationship request renewed.', 'relationship': existing.to_dict()}), 200

    new_rel = CaretakerLink(
        caretaker_user_id=caretaker_id,
        linked_user_id=ward_id,
        consent_status=init_status,
        alert_scope=alert_scope,
        notes=notes
    )
    db_session.add(new_rel)

    # Record consent
    consent = Consent(
        ward_id=ward_id,
        caretaker_id=caretaker_id,
        consent_type="security_monitoring",
        granted=True
    )
    db_session.add(consent)
    db_session.commit()

    return jsonify({
        'message': 'Relationship established successfully.',
        'relationship': new_rel.to_dict()
    }), 201

@caretaker_bp.route('/consent', methods=['POST'])
@token_required
def update_consent(current_user):
    data = request.get_json() or {}
    relationship_id = data.get('relationship_id') or data.get('link_id')
    status = data.get('status', 'ACTIVE') # 'ACTIVE' or 'REVOKED'
    alert_scope = data.get('alert_scope')

    rel = db_session.query(CaretakerLink).filter(
        (CaretakerLink.link_id == relationship_id)
    ).first()
    if not rel:
        return jsonify({'error': 'Relationship not found'}), 404

    # User must be part of relationship
    if rel.linked_user_id != current_user.user_id and rel.caretaker_user_id != current_user.user_id:
        return jsonify({'error': 'Unauthorized: You are not part of this relationship.'}), 403

    if status in ['ACTIVE', 'REVOKED', 'PENDING']:
        rel.consent_status = status
    if alert_scope in ['BLOCK_ONLY', 'BLOCK_AND_WARN', 'ALL_ACTIVITY']:
        rel.alert_scope = alert_scope

    db_session.commit()
    return jsonify({
        'message': f'Relationship status updated to {rel.consent_status}',
        'relationship': rel.to_dict()
    }), 200

@caretaker_bp.route('/revoke', methods=['POST'])
@token_required
def revoke_relationship(current_user):
    data = request.get_json() or {}
    relationship_id = data.get('relationship_id') or data.get('link_id')

    rel = db_session.query(CaretakerLink).filter(
        (CaretakerLink.link_id == relationship_id)
    ).first()
    if not rel:
        return jsonify({'error': 'Relationship not found'}), 404

    if rel.linked_user_id != current_user.user_id and rel.caretaker_user_id != current_user.user_id:
        return jsonify({'error': 'Unauthorized: You cannot revoke another user\'s relationship.'}), 403

    rel.consent_status = 'REVOKED'
    # Update consent record
    consent = db_session.query(Consent).filter_by(
        ward_id=rel.linked_user_id,
        caretaker_id=rel.caretaker_user_id
    ).first()
    if consent:
        consent.granted = False
        consent.revoked_at = datetime.utcnow()

    db_session.commit()
    return jsonify({'message': 'Relationship has been revoked.'}), 200

@caretaker_bp.route('/ward/<ward_id>/scans', methods=['GET'])
@role_required(['caretaker'])
def get_ward_scans(current_user, ward_id):
    # Verify active relationship and consent
    rel = db_session.query(CaretakerLink).filter(
        CaretakerLink.caretaker_user_id == current_user.user_id,
        CaretakerLink.linked_user_id == ward_id,
        CaretakerLink.consent_status == 'ACTIVE'
    ).first()

    if not rel:
        return jsonify({'error': 'You do not have active caretaker consent or permission for this user.'}), 403

    query = db_session.query(ScanEvent).filter_by(user_id=ward_id)
    if rel.alert_scope == 'BLOCK_ONLY':
        query = query.filter_by(risk_level='BLOCK')
    elif rel.alert_scope == 'BLOCK_AND_WARN':
        query = query.filter(ScanEvent.risk_level.in_(['BLOCK', 'WARN']))

    scans = query.order_by(ScanEvent.created_at.desc()).limit(30).all()
    return jsonify({'scans': [s.to_dict() for s in scans]}), 200
