import re

PATTERNS = {
    "DIGITAL_ARREST": {
        "title": "Digital Arrest / Fake Law Enforcement Threat",
        "severity": 65,
        "keywords": [
            r'\bdigital\s+arrest\b',
            r'\bcbi\s+(inquiry|officer|investigation)\b',
            r'\b(customs|courier)\s+(parcel|package)\s+(seized|drugs|illegal)\b',
            r'\bnarcotics\s+control\s+bureau\b',
            r'\barrest\s+warrant\b',
            r'\bcourt\s+(order|summons|notice)\b',
            r'\bvideo\s+call\s+(inquiry|investigation)\b',
            r'\bdo\s+not\s+(hang\s+up|disconnect)\b'
        ],
        "reason": "Claims law enforcement action, digital arrest, or parcel seizure to provoke fear. Official authorities never conduct arrest or interrogation over video calls."
    },
    "BANK_KYC_SUSPENSION": {
        "title": "Fake Bank Suspension / KYC Expiry",
        "severity": 55,
        "keywords": [
            r'\b(account|debit\s+card|netbanking).{0,25}(blocked|suspended|deactivated|closed)\b',
            r'\b(kyc|pan\s+card).{0,20}(update|expired|mandatory|link|verify)\b',
            r'\b(update|verify|link).{0,20}(kyc|pan\s+card)\b',
            r'\belectricity\s+(power\s+cut|bill\s+unpaid|disconnected\s+tonight)\b',
            r'\bsim\s+card\s+(blocked|deactivated)\b',
            r'\bunauthorized\s+transaction\s+detected\b'
        ],
        "reason": "Falsely threatens immediate bank block, electricity cutoff, or SIM deactivation to induce panic."
    },
    "CREDENTIAL_OTP_THEFT": {
        "title": "Credential or OTP Solicitation",
        "severity": 60,
        "keywords": [
            r'\b(share|send|provide|verify).{0,20}(otp|one\s+time\s+password|pin|cvv|password)\b',
            r'\benter\s+(your\s+)?(card\s+number|banking\s+password)\b',
            r'\bverification\s+code\s+sent\b'
        ],
        "reason": "Requests confidential security tokens (OTP/PIN/Password) which banks and trusted services will NEVER ask for."
    },
    "REMOTE_ACCESS_APP": {
        "title": "Remote Screen Control / Malicious App",
        "severity": 60,
        "keywords": [
            r'\b(install|download)\s+(anydesk|teamviewer|rustdesk|quicksupport|zoho\s+assist)\b',
            r'\bdownload\s+(\.apk|app\s+file)\b',
            r'\bgive\s+remote\s+access\b'
        ],
        "reason": "Urges installation of screen-sharing or remote desktop apps that grant attackers total device control."
    },
    "FAKE_PRIZE_LOTTERY": {
        "title": "Fake Prize, Free Reward or Lottery",
        "severity": 45,
        "keywords": [
            r'\b(won|winner|congratulations).{0,20}(lottery|iphone|car|cash\s+prize|25\s+lakh)\b',
            r'\bkbc\s+(lucky\s+draw|lottery)\b',
            r'\bfree\s+(recharge|diamonds|robux|gift\s+card)\b',
            r'\bclaim\s+your\s+reward\s+now\b'
        ],
        "reason": "Promises exorbitant unearned gifts or lotteries to trick victims into clicking or paying advance fees."
    },
    "JOB_INVESTMENT_SCAM": {
        "title": "High Return Task / Job Scam",
        "severity": 45,
        "keywords": [
            r'\b(part\s+time\s+job|work\s+from\s+home)\s+(earn|daily)\b',
            r'\b(like|subscribe)\s+(youtube|instagram)\s+(video|videos)\s+earn\b',
            r'\bguaranteed\s+(return|profit|income)\b',
            r'\bdeposit\s+\d+\s+earn\s+\d+\b'
        ],
        "reason": "Promises guaranteed daily income for trivial online tasks, standard precursor to advance-fee deposit fraud."
    },
    "URGENCY_PRESSURE": {
        "title": "High Urgency Coercion",
        "severity": 25,
        "keywords": [
            r'\b(immediately|within\s+24\s+hours|urgent|action\s+required|today\s+only|last\s+chance|final\s+warning)\b',
            r'\botherwise\s+(your\s+account|you\s+will\s+be)\b'
        ],
        "reason": "Applies high time-pressure tactics designed to bypass rational caution."
    }
}

def analyze_message(text: str) -> dict:
    signals = []
    total_score = 0
    lower_text = text.lower()

    for pattern_key, pattern_data in PATTERNS.items():
        matched = False
        for kw in pattern_data["keywords"]:
            if re.search(kw, lower_text):
                matched = True
                break
        
        if matched:
            signals.append({
                "code": pattern_key,
                "severity": pattern_data["severity"],
                "title": pattern_data["title"],
                "reason": pattern_data["reason"]
            })
            total_score += pattern_data["severity"]

    # Calculate synergy multiplier: If high urgency is paired with banking or credentials, escalate threat
    has_urgency = any(s["code"] == "URGENCY_PRESSURE" for s in signals)
    has_bank_or_otp = any(s["code"] in ["BANK_KYC_SUSPENSION", "CREDENTIAL_OTP_THEFT", "DIGITAL_ARREST"] for s in signals)
    
    if has_urgency and has_bank_or_otp:
        total_score += 15

    return {
        "signals": signals,
        "calculated_score": min(total_score, 100),
        "scam_categories": [s["code"] for s in signals]
    }
