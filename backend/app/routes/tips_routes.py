from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.safety_tip import SafetyTip

tips_bp = Blueprint('tips', __name__)

DEFAULT_TIPS = [
    {
        "id": "tip-otp-1",
        "category": "otp_safety",
        "target_mode": "all",
        "title_en": "Never Share Your OTP",
        "title_kn": "ನಿಮ್ಮ ಒಟಿಪಿಯನ್ನು ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ",
        "title_hi": "अपना ओटीपी कभी किसी के साथ साझा न करें",
        "content_en": "Banks, electricity boards, and government agencies NEVER ask for OTPs or PINs over calls or SMS. If someone demands an OTP, disconnect immediately.",
        "content_kn": "ಬ್ಯಾಂಕುಗಳು ಅಥವಾ ಸರ್ಕಾರಿ ಸಂಸ್ಥೆಗಳು ಫೋನ್ ಕರೆ ಅಥವಾ SMS ಮೂಲಕ OTP ಅಥವಾ PIN ಕೇಳುವುದಿಲ್ಲ. ಯಾರಾದರೂ ಕೇಳಿದರೆ ತಕ್ಷಣ ಕರೆ ಕಟ್ ಮಾಡಿ.",
        "content_hi": "बैंक या सरकारी विभाग फोन कॉल या एसएमएस पर कभी भी ओटीपी या पिन नहीं मांगते। यदि कोई ओटीपी मांगे, तो तुरंत फोन काट दें।",
        "icon": "key"
    },
    {
        "id": "tip-senior-1",
        "category": "digital_arrest",
        "target_mode": "senior",
        "title_en": "Beware of Digital Arrest & Police Video Calls",
        "title_kn": "ನಕಲಿ ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ಕರೆಗಳಿಂದ ಎಚ್ಚರ",
        "title_hi": "नकली पुलिस या डिजिटल अरेस्ट कॉल से सावधान रहें",
        "content_en": "Police, CBI, Customs, and Judges will NEVER video call you demanding money or threatening arrest. There is no legal procedure called 'Digital Arrest'. Cut the call and call your trusted family member.",
        "content_kn": "ಪೊಲೀಸರು ಅಥವಾ ಸಿಬಿಐ ಎಂದಿಗೂ ವಿಡಿಯೋ ಕಾಲ್ ಮಾಡಿ ಹಣ ಕೇಳುವುದಿಲ್ಲ ಅಥವಾ 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್' ಮಾಡುವುದಿಲ್ಲ. ತಕ್ಷಣ ಕರೆ ಕಟ್ ಮಾಡಿ ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ತಿಳಿಸಿ.",
        "content_hi": "पुलिस या सीबीआई कभी भी वीडियो कॉल पर पैसे नहीं मांगते और न ही 'डिजिटल अरेस्ट' करते हैं। तुरंत कॉल काटें और अपने परिवार को बताएं।",
        "icon": "shield-alert"
    },
    {
        "id": "tip-kid-1",
        "category": "fake_prizes",
        "target_mode": "kid",
        "title_en": "No Free Diamonds or Free Phones!",
        "title_kn": "ಯಾವುದೂ ಉಚಿತವಾಗಿ ಸಿಗುವುದಿಲ್ಲ!",
        "title_hi": "कोई मुफ्त फोन या गेम कॉइन नहीं मिलता!",
        "content_en": "If a game, website, or stranger says you won a free iPhone or free gaming coins, do NOT click the link. Always ask your mom, dad, or teacher first!",
        "content_kn": "ಯಾವುದೇ ಆಟ ಅಥವಾ ವೆಬ್‌ಸೈಟ್ ಉಚಿತ ಫೋನ್ ಅಥವಾ ಆಟದ ನಾಣ್ಯಗಳನ್ನು ನೀಡುತ್ತದೆ ಎಂದರೆ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ. ಮೊದಲು ನಿಮ್ಮ ಪೋಷಕರಿಗೆ ತಿಳಿಸಿ!",
        "content_hi": "अगर कोई गेम या वेबसाइट कहती है कि आपने मुफ्त फोन या गेम सिक्के जीते हैं, तो क्लिक न करें। हमेशा अपने माता-पिता से पूछें!",
        "icon": "gift"
    },
    {
        "id": "tip-adult-1",
        "category": "job_investment",
        "target_mode": "adult",
        "title_en": "Work-From-Home & YouTube Like Scams",
        "title_kn": "ಅಧಿಕ ಲಾಭದ ಅರೆಕಾಲಿಕ ಉದ್ಯೋಗ ವಂಚನೆಗಳು",
        "title_hi": "घर बैठे कमाई और यूट्यूब लाइक घोटाले",
        "content_en": "Scammers send Telegram/WhatsApp tasks promising Rs. 5,000/day for liking videos, then demand security deposits. Legitimate employers never ask employees to pay to get paid.",
        "content_kn": "ಯೂಟ್ಯೂಬ್ ಲೈಕ್ ಮಾಡಲು ಹಣ ನೀಡುವುದಾಗಿ ಹೇಳಿ ಠೇವಣಿ ಹಣ ಕೇಳುವ ಟೆಲಿಗ್ರಾಮ್ ಉದ್ಯೋಗಗಳು ವಂಚನೆಗಳಾಗಿವೆ. ಅಧಿಕೃತ ಕಂಪನಿಗಳು ಹಣ ಕೇಳುವುದಿಲ್ಲ.",
        "content_hi": "वीडियो लाइक करने पर पैसे देने का वादा करने वाले और डिपॉजिट मांगने वाले संदेश धोखाधड़ी हैं। कोई भी वैध कंपनी पैसे नहीं मांगती।",
        "icon": "briefcase"
    },
    {
        "id": "tip-caretaker-1",
        "category": "elder_child_safety",
        "target_mode": "caretaker",
        "title_en": "Guiding Seniors and Children",
        "title_kn": "ಹಿರಿಯರು ಮತ್ತು ಮಕ್ಕಳನ್ನು ರಕ್ಷಿಸುವ ಮಾರ್ಗದರ್ಶನ",
        "title_hi": "बुजुर्गों और बच्चों की सुरक्षा के नियम",
        "content_en": "Remind seniors to never act on urgent calls claiming courier parcels or electricity cutoffs. Teach children to always show strange messages to you before clicking.",
        "content_kn": "ಅಪರಿಚಿತ ಕರೆಗಳಿಗೆ ಗಾಬರಿಯಾಗದಂತೆ ಹಿರಿಯರಿಗೆ ತಿಳಿಸಿ. ಮಕ್ಕಳು ಯಾವುದೇ ವಿಚಿತ್ರ ಲಿಂಕ್ ನೋಡಿದ ತಕ್ಷಣ ನಿಮಗೆ ತೋರಿಸುವಂತೆ ಪ್ರೋತ್ಸಾಹಿಸಿ.",
        "content_hi": "बुजुर्गों को समझाएं कि पार्सल या बिजली कटने के डराने वाले फोन कॉल पर घबराएं नहीं। बच्चों को सिखाएं कि संदिग्ध लिंक पहले आपको दिखाएं।",
        "icon": "users"
    }
]

@tips_bp.route('', methods=['GET'])
@tips_bp.route('/', methods=['GET'])
def get_tips():
    lang = request.args.get('lang', 'en').lower()
    target_mode = request.args.get('mode', 'all').lower()

    if lang not in ['en', 'kn', 'hi']:
        lang = 'en'

    # Check if DB has tips, if not seed them
    count = db_session.query(SafetyTip).count()
    if count == 0:
        for t_data in DEFAULT_TIPS:
            tip = SafetyTip(
                id=t_data["id"],
                category=t_data["category"],
                target_mode=t_data["target_mode"],
                title_en=t_data["title_en"],
                title_kn=t_data["title_kn"],
                title_hi=t_data["title_hi"],
                content_en=t_data["content_en"],
                content_kn=t_data["content_kn"],
                content_hi=t_data["content_hi"],
                icon=t_data["icon"]
            )
            db_session.add(tip)
        db_session.commit()

    query = db_session.query(SafetyTip)
    if target_mode != 'all':
        query = query.filter(SafetyTip.target_mode.in_(['all', target_mode]))

    tips = query.all()
    return jsonify({
        'tips': [t.to_dict(lang=lang) for t in tips]
    }), 200
