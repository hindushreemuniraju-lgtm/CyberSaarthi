from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.contact import TrustedContact
from backend.app.utils.auth_helpers import token_required

contact_bp = Blueprint('contacts', __name__)

@contact_bp.route('', methods=['GET'])
@token_required
def get_contacts(current_user):
    contacts = db_session.query(TrustedContact).filter_by(user_id=current_user.id).all()
    return jsonify({'contacts': [c.to_dict() for c in contacts]}), 200

@contact_bp.route('', methods=['POST'])
@token_required
def add_contact(current_user):
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    relationship = (data.get('relationship') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip() or None
    is_emergency = bool(data.get('is_emergency', False))

    if not name or not phone or not relationship:
        return jsonify({'error': 'Name, relationship, and phone are required.'}), 400

    contact = TrustedContact(
        user_id=current_user.id,
        name=name,
        relationship=relationship,
        phone=phone,
        email=email,
        is_emergency=is_emergency
    )
    db_session.add(contact)
    db_session.commit()

    return jsonify({
        'message': 'Trusted contact added successfully',
        'contact': contact.to_dict()
    }), 201

@contact_bp.route('/<contact_id>', methods=['DELETE'])
@token_required
def delete_contact(current_user, contact_id):
    contact = db_session.query(TrustedContact).filter_by(id=contact_id, user_id=current_user.id).first()
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404

    db_session.delete(contact)
    db_session.commit()
    return jsonify({'message': 'Contact deleted successfully'}), 200
