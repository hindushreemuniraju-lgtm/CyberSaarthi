import json
from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.scan_event import ScanEvent
from backend.app.models.alert import Alert
from backend.app.models.relationship import CaretakerRelationship
from backend.app.models.safety_tip import AuditLog
from backend.app.risk_engine.decision_engine import DecisionEngine
from backend.app.utils.auth_helpers import optional_token, token_required
from backend.app.utils.sanitizer import sanitize_text

scan_bp = Blueprint('scan', __name__)
engine = DecisionEngine()

@scan_bp.route('', methods=['POST'])
@scan_bp.route('/', methods=['POST'])
@scan_bp.route('/analyze', methods=['POST'])
@optional_token
def perform_scan(current_user=None):
    data = request.get_json() or {}
    raw_input = data.get('content') or data.get('url') or data.get('message') or ''
    cleaned_input = sanitize_text(raw_input)

    if not cleaned_input:
        return jsonify({'error': 'Please provide a URL or message to analyze.'}), 400

    # Determine user mode and language preference
    user_mode = data.get('user_mode') or (current_user.user_mode if current_user else 'adult')
    language = data.get('language') or (current_user.preferred_language if current_user else 'en')

    # Run analysis through the centralized DecisionEngine
    result = engine.evaluate(cleaned_input, user_mode=user_mode, language=language)

    scan_event_id = None
    if current_user:
        # Save scan to database
        scan_event = ScanEvent(
            user_id=current_user.id,
            input_type=result['input_type'],
            input_hash=result['input_hash'],
            input_preview=result['input_preview'],
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            primary_reason=result['primary_reason'],
            signals_json=json.dumps(result['signals']),
            details_json=json.dumps({
                "explanation": result['explanation'],
                "recommendation": result['recommendation'],
                "headline": result['headline']
            }),
            external_sources_json=json.dumps(result['external_sources'])
        )
        db_session.add(scan_event)
        db_session.flush()
        scan_event_id = scan_event.id

        # Trigger caretaker alert if risk is BLOCK or WARN based on active consents
        if result['risk_level'] in ['BLOCK', 'WARN']:
            # Find all active approved caretakers for this user
            relationships = db_session.query(CaretakerRelationship).filter_by(
                ward_id=current_user.id,
                status='ACTIVE'
            ).all()

            for rel in relationships:
                should_alert = False
                if rel.alert_scope == 'ALL_ACTIVITY':
                    should_alert = True
                elif rel.alert_scope == 'BLOCK_AND_WARN' and result['risk_level'] in ['BLOCK', 'WARN']:
                    should_alert = True
                elif rel.alert_scope == 'BLOCK_ONLY' and result['risk_level'] == 'BLOCK':
                    should_alert = True

                if should_alert:
                    alert = Alert(
                        scan_event_id=scan_event.id,
                        ward_id=current_user.id,
                        caretaker_id=rel.caretaker_id,
                        severity='CRITICAL' if result['risk_level'] == 'BLOCK' else 'HIGH',
                        title=f"High-Risk Alert for {current_user.name}: {result['headline']}",
                        summary=f"{current_user.name} encountered suspicious content. Risk Score: {result['risk_score']}/100. Action recommended: {result['recommendation']}"
                    )
                    db_session.add(alert)

        db_session.commit()

    result['scan_id'] = scan_event_id
    return jsonify(result), 200

@scan_bp.route('/history', methods=['GET'])
@token_required
def get_scan_history(current_user):
    limit = min(int(request.args.get('limit', 20)), 100)
    scans = db_session.query(ScanEvent).filter_by(user_id=current_user.id)\
        .order_by(ScanEvent.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'history': [s.to_dict() for s in scans]
    }), 200

@scan_bp.route('/<scan_id>', methods=['GET'])
@token_required
def get_scan_by_id(current_user, scan_id):
    scan = db_session.query(ScanEvent).filter_by(id=scan_id).first()
    if not scan:
        return jsonify({'error': 'Scan event not found'}), 404

    # Allow access if owner or approved caretaker
    is_owner = (scan.user_id == current_user.id)
    is_caretaker = False
    if not is_owner and scan.user_id:
        rel = db_session.query(CaretakerRelationship).filter_by(
            caretaker_id=current_user.id,
            ward_id=scan.user_id,
            status='ACTIVE'
        ).first()
        if rel:
            is_caretaker = True

    if not is_owner and not is_caretaker:
        return jsonify({'error': 'Unauthorized to view this scan'}), 403

    return jsonify({'scan': scan.to_dict()}), 200
