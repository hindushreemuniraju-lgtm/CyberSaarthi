from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.alert import Alert
from backend.app.utils.auth_helpers import token_required

alert_bp = Blueprint('alerts', __name__)

@alert_bp.route('', methods=['GET'])
@token_required
def get_alerts(current_user):
    # Returns alerts where user is caretaker or ward
    if current_user.user_mode == 'caretaker':
        alerts = db_session.query(Alert).filter_by(caretaker_id=current_user.id)\
            .order_by(Alert.created_at.desc()).limit(50).all()
    else:
        alerts = db_session.query(Alert).filter_by(ward_id=current_user.id)\
            .order_by(Alert.created_at.desc()).limit(50).all()

    return jsonify({'alerts': [a.to_dict() for a in alerts]}), 200

@alert_bp.route('/<alert_id>/read', methods=['PUT'])
@token_required
def mark_alert_read(current_user, alert_id):
    alert = db_session.query(Alert).filter_by(id=alert_id).first()
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    if alert.caretaker_id != current_user.id and alert.ward_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    alert.status = 'READ'
    db_session.commit()
    return jsonify({'message': 'Alert marked as read', 'alert': alert.to_dict()}), 200

@alert_bp.route('/<alert_id>/resolve', methods=['PUT'])
@token_required
def resolve_alert(current_user, alert_id):
    alert = db_session.query(Alert).filter_by(id=alert_id).first()
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    if alert.caretaker_id != current_user.id:
        return jsonify({'error': 'Only the caretaker can mark an alert as resolved'}), 403

    alert.status = 'RESOLVED'
    db_session.commit()
    return jsonify({'message': 'Alert resolved', 'alert': alert.to_dict()}), 200
