import hashlib
from datetime import datetime
from backend.app.risk_engine.url_analyzer import analyze_url
from backend.app.risk_engine.message_analyzer import analyze_message
from backend.app.risk_engine.reputation_analyzer import ReputationAnalyzer
from backend.app.risk_engine.risk_scorer import RiskScorer
from backend.app.utils.sanitizer import extract_urls_from_text, normalize_url

EXPLANATIONS = {
    "BLOCK": {
        "kid": {
            "en": {
                "headline": "🛑 Let's stop for a moment!",
                "explanation": "This message or link looks unsafe. Someone might be pretending to give prizes or trick you. Do not open it!",
                "action": "Ask your trusted adult right now. Show this screen to your parents or caretaker."
            },
            "kn": {
                "headline": "🛑 ಒಂದು ಕ್ಷಣ ನಿಲ್ಲಿ!",
                "explanation": "ಈ ಲಿಂಕ್ ಅಥವಾ ಸಂದೇಶ ಸುರಕ್ಷಿತವಾಗಿಲ್ಲ. ಯಾರೋ ನಿಮಗೆ ಸುಳ್ಳು ಹೇಳಿ ಮೋಸ ಮಾಡಲು ಪ್ರಯತ್ನಿಸುತ್ತಿರಬಹುದು. ಇದನ್ನು ತೆರೆಯಬೇಡಿ!",
                "action": "ತಕ್ಷಣ ನಿಮ್ಮ ಪೋಷಕರು ಅಥವಾ ಹಿರಿಯರನ್ನು ಕೇಳಿ. ಈ ಪರದೆಯನ್ನು ಅವರಿಗೆ ತೋರಿಸಿ."
            },
            "hi": {
                "headline": "🛑 एक पल के लिए रुकें!",
                "explanation": "यह लिंक या संदेश सुरक्षित नहीं लग रहा है। कोई आपको धोखा देने की कोशिश कर सकता है। इसे न खोलें!",
                "action": "अभी अपने माता-पिता या बड़ों से पूछें। यह स्क्रीन उन्हें दिखाएं।"
            }
        },
        "senior": {
            "en": {
                "headline": "🔴 DANGER: Please Do Not Open This",
                "explanation": "This may be a scam. Someone may be trying to steal your pension, bank money, or personal information.",
                "action": "Do not click this link or reply. Call your caretaker or a family member to verify."
            },
            "kn": {
                "headline": "🔴 ಅಪಾಯ: ದಯವಿಟ್ಟು ಇದನ್ನು ತೆರೆಯಬೇಡಿ",
                "explanation": "ಇದು ವಂಚನೆಯಾಗಿರಬಹುದು. ಯಾರೋ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಹಣ ಅಥವಾ ಖಾಸಗಿ ಮಾಹಿತಿಯನ್ನು ಕದಿಯಲು ಪ್ರಯತ್ನಿಸುತ್ತಿದ್ದಾರೆ.",
                "action": "ಈ ಲಿಂಕ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ. ತಕ್ಷಣ ನಿಮ್ಮ ಕುಟುಂಬದವರಿಗೆ ಅಥವಾ ಕೇರ್‌ಟೇಕರ್‌ಗೆ ಕರೆ ಮಾಡಿ ತಿಳಿಸಿ."
            },
            "hi": {
                "headline": "🔴 खतरा: कृपया इसे न खोलें",
                "explanation": "यह एक धोखाधड़ी (स्कैम) हो सकती है। कोई आपके बैंक से पैसे या निजी जानकारी चुराने का प्रयास कर रहा है।",
                "action": "इस लिंक पर क्लिक न करें। पुष्टि करने के लिए अपने परिवार या केयरटेकर को कॉल करें।"
            }
        },
        "adult": {
            "en": {
                "headline": "High Risk Detected (Phishing / Scam Threat)",
                "explanation": "This content exhibits critical phishing indicators, deceptive domain impersonation, or coercive scam patterns.",
                "action": "Do not visit the domain, enter credentials, or contact numbers provided in the message. Delete or report."
            },
            "kn": {
                "headline": "ಹೆಚ್ಚಿನ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ (ಫಿಶಿಂಗ್ / ವಂಚನೆ ಬೆದರಿಕೆ)",
                "explanation": "ಈ ಲಿಂಕ್ ಅಥವಾ ಸಂದೇಶದಲ್ಲಿ ಬ್ರ್ಯಾಂಡ್ ವಂಚನೆ, ನಕಲಿ ಬ್ಯಾಂಕಿಂಗ್ ಅಥವಾ ಕೃತಕ ತುರ್ತು ಬೆದರಿಕೆಯ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.",
                "action": "ಯಾವುದೇ ವಿವರಗಳನ್ನು ನಮೂದಿಸಬೇಡಿ. ಲಿಂಕ್ ತೆರೆಯಬೇಡಿ ಮತ್ತು ಈ ಸಂದೇಶವನ್ನು ತಕ್ಷಣ ಅಳಿಸಿಹಾಕಿ."
            },
            "hi": {
                "headline": "उच्च जोखिम का पता चला (फ़िशिंग / स्कैम ख़तरा)",
                "explanation": "इस सामग्री में फ़िशिंग, फर्जी ब्रांड या धोखाधड़ी के गंभीर संकेत मिले हैं।",
                "action": "इस वेबसाइट पर न जाएं और कोई भी जानकारी दर्ज न करें। तुरंत संदेश हटाएं।"
            }
        },
        "caretaker": {
            "en": {
                "headline": "High-Risk Threat Intercepted for Your Ward",
                "explanation": "High-confidence scam or credential harvesting link was checked. The ward was advised not to proceed.",
                "action": "Review the details below and ensure the user did not share any OTP, PIN, or banking passwords."
            },
            "kn": {
                "headline": "ನಿಮ್ಮ ಕುಟುಂಬದವರಿಗೆ ಹೆಚ್ಚಿನ ಅಪಾಯಕಾರಿ ಸಂದೇಶ ಪತ್ತೆಯಾಗಿದೆ",
                "explanation": "ಹಾನಿಕಾರಕ ವಂಚನೆ ಲಿಂಕ್ ಪತ್ತೆಯಾಗಿದೆ. ಲಿಂಕ್ ತೆರೆಯದಂತೆ ಅವರಿಗೆ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.",
                "action": "ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅವರು ಯಾವುದೇ ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಹಂಚಿಕೊಂಡಿಲ್ಲವೆಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ."
            },
            "hi": {
                "headline": "आपके आश्रित के लिए उच्च जोखिम वाले खतरे का पता चला",
                "explanation": "धोखाधड़ी वाला लिंक पकड़ा गया है। यूजर को आगे न बढ़ने की सलाह दी गई है।",
                "action": "नीचे दिए गए विवरण देखें और सुनिश्चित करें कि उन्होंने कोई ओटीपी या पासवर्ड साझा नहीं किया है।"
            }
        }
    },
    "WARN": {
        "kid": {
            "en": {
                "headline": "⚠️ Be Careful!",
                "explanation": "Something about this link or message looks unfamiliar or strange. Do not trust it without checking.",
                "action": "Show this to a grown-up before clicking."
            },
            "kn": {
                "headline": "⚠️ ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ!",
                "explanation": "ಈ ಸಂದೇಶ ಅಥವಾ ಲಿಂಕ್‌ನಲ್ಲಿ ಕೆಲವು ಅನುಮಾನಾಸ್ಪದ ವಿಷಯಗಳಿವೆ. ಪರಿಶೀಲಿಸದೆ ಇದನ್ನು ನಂಬಬೇಡಿ.",
                "action": "ಇದನ್ನು ಕ್ಲಿಕ್ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಮನೆಯ ಹಿರಿಯರಿಗೆ ತೋರಿಸಿ."
            },
            "hi": {
                "headline": "⚠️ सावधान रहें!",
                "explanation": "इस लिंक या संदेश में कुछ असामान्य लग रहा है। बिना सोचे-समझे इस पर भरोसा न करें।",
                "action": "क्लिक करने से पहले किसी बड़े को दिखाएं।"
            }
        },
        "senior": {
            "en": {
                "headline": "🟡 Suspicious: Proceed With Caution",
                "explanation": "This message uses pushy words or unfamiliar links. Do not send any money or card details.",
                "action": "If you are unsure, ask your caretaker or call the official company phone number directly."
            },
            "kn": {
                "headline": "🟡 ಅನುಮಾನಾಸ್ಪದ: ಜಾಗರೂಕರಾಗಿರಿ",
                "explanation": "ಈ ಸಂದೇಶದಲ್ಲಿ ಆತುರಪಡಿಸುವ ಮಾತುಗಳಿವೆ. ಹಣ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
                "action": "ಸಂಶಯವಿದ್ದರೆ, ನಿಮ್ಮ ಕೇರ್‌ಟೇಕರ್ ಅಥವಾ ಕುಟುಂಬದವರನ್ನು ಕೇಳಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ."
            },
            "hi": {
                "headline": "🟡 संदिग्ध: सावधानी से आगे बढ़ें",
                "explanation": "इस संदेश में दबाव बनाने वाले शब्द या अनजान लिंक हैं। कोई पैसे या कार्ड का विवरण न भेजें।",
                "action": "यदि आप सुनिश्चित नहीं हैं, तो अपने केयरटेकर से पूछें।"
            }
        },
        "adult": {
            "en": {
                "headline": "Potentially Suspicious Content",
                "explanation": "Moderate risk signals detected (e.g. link shortener, unverified domain, or high-urgency language).",
                "action": "Exercise caution. Verify sender authenticity through official channels before sharing information."
            },
            "kn": {
                "headline": "ಅನುಮಾನಾಸ್ಪದ ವಿಷಯ ಪತ್ತೆಯಾಗಿದೆ",
                "explanation": "ಮಧ್ಯಮ ಅಪಾಯದ ಸಂಕೇತಗಳು ಕಂಡುಬಂದಿವೆ (ಚಿಕ್ಕ ಲಿಂಕ್, ಅಪರಿಚಿತ ಡೊಮೇನ್ ಅಥವಾ ಆತುರದ ಭಾಷೆ).",
                "action": "ಎಚ್ಚರಿಕೆ ವಹಿಸಿ. ಯಾವುದೇ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳುವ ಮೊದಲು ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಪರಿಶೀಲಿಸಿ."
            },
            "hi": {
                "headline": "संभावित रूप से संदिग्ध सामग्री",
                "explanation": "मध्यम जोखिम के संकेत मिले हैं (जैसे शॉर्ट लिंक, अज्ञात डोमेन या दबाव बनाने वाली भाषा)।",
                "action": "सावधानी बरतें। जानकारी साझा करने से पहले आधिकारिक माध्यम से पुष्टि करें।"
            }
        },
        "caretaker": {
            "en": {
                "headline": "Suspicious Content Flagged",
                "explanation": "Content with moderate anomalies was analyzed by the ward. Advised caution.",
                "action": "Monitor if the ward receives similar unsolicited solicitations."
            },
            "kn": {
                "headline": "ಅನುಮಾನಾಸ್ಪದ ವಿಷಯದ ಎಚ್ಚರಿಕೆ",
                "explanation": "ಮಧ್ಯಮ ಮಟ್ಟದ ಅಪಾಯದ ಸಂದೇಶ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಜಾಗರೂಕರಾಗಿರಲು ತಿಳಿಸಲಾಗಿದೆ.",
                "action": "ಕುಟುಂಬದವರಿಗೆ ಈ ರೀತಿಯ ಸಂದೇಶಗಳು ಪುನಃ ಬರುತ್ತಿವೆಯೇ ಗಮನಿಸಿ."
            },
            "hi": {
                "headline": "संदिग्ध सामग्री चिह्नित",
                "explanation": "मध्यम जोखिम वाली सामग्री का विश्लेषण किया गया है।",
                "action": "देखें कि क्या यूजर को ऐसे अन्य संदेश मिल रहे हैं।"
            }
        }
    },
    "SAFE": {
        "kid": {
            "en": {
                "headline": "🟢 Looks Low-Risk!",
                "explanation": "No scam signals were found. But remember, always be safe on the internet and never share passwords!",
                "action": "You can continue, but remember to stay smart and ask adults if anything feels weird."
            },
            "kn": {
                "headline": "🟢 ಸುರಕ್ಷಿತವೆಂದು ತೋರುತ್ತಿದೆ!",
                "explanation": "ಯಾವುದೇ ವಂಚನೆಯ ಸಂಕೇತಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಆದರೂ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ!",
                "action": "ನೀವು ಮುಂದುವರಿಯಬಹುದು, ಆದರೆ ಯಾವಾಗಲೂ ಜಾಗರೂಕರಾಗಿರಿ."
            },
            "hi": {
                "headline": "🟢 कम जोखिम वाला लग रहा है!",
                "explanation": "धोखाधड़ी का कोई संकेत नहीं मिला। फिर भी इंटरनेट पर सुरक्षित रहें और कभी पासवर्ड शेयर न करें!",
                "action": "आप आगे बढ़ सकते हैं, लेकिन हमेशा सतर्क रहें।"
            }
        },
        "senior": {
            "en": {
                "headline": "🟢 Low Risk Detected",
                "explanation": "This message or link appears standard. No obvious scam tricks were found.",
                "action": "It looks safe, but never give your bank OTP or PIN to anyone who calls you."
            },
            "kn": {
                "headline": "🟢 ಕಡಿಮೆ ಅಪಾಯ ಕಂಡುಬಂದಿದೆ",
                "explanation": "ಈ ಲಿಂಕ್ ಅಥವಾ ಸಂದೇಶ ಸಾಮಾನ್ಯವಾಗಿದೆ. ಯಾವುದೇ ವಂಚನೆಯ ಸಂಕೇತಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
                "action": "ಇದು ಸುರಕ್ಷಿತವಾಗಿದೆ, ಆದರೆ ಫೋನ್ ಕರೆಗಳಲ್ಲಿ ಯಾರೊಂದಿಗೂ OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ."
            },
            "hi": {
                "headline": "🟢 कम जोखिम पाया गया",
                "explanation": "यह संदेश या लिंक सामान्य लग रहा है। कोई स्पष्ट धोखाधड़ी नहीं मिली।",
                "action": "यह सुरक्षित लगता है, लेकिन फोन पर कभी किसी को बैंक ओटीपी न दें।"
            }
        },
        "adult": {
            "en": {
                "headline": "Low Risk / Clean Indicators",
                "explanation": "No known malicious patterns, domain spoofing, or deceptive coercion identified in our analysis.",
                "action": "Standard browsing recommended. Note: cyber threats evolve, maintain standard vigilance."
            },
            "kn": {
                "headline": "ಕಡಿಮೆ ಅಪಾಯ / ಶುದ್ಧ ಸೂಚಕಗಳು",
                "explanation": "ಯಾವುದೇ ದುರುದ್ದೇಶಪೂರಿತ ಮಾದರಿಗಳು ಅಥವಾ ನಕಲಿ ಡೊಮೇನ್ ಗುರುತಿಸಲ್ಪಟ್ಟಿಲ್ಲ.",
                "action": "ಸಾಮಾನ್ಯ ಬಳಕೆಗೆ ಸುರಕ್ಷಿತವಾಗಿದೆ. ಆದರೆ ಸದಾ ಜಾಗರೂಕರಾಗಿರಿ."
            },
            "hi": {
                "headline": "कम जोखिम / सुरक्षित संकेत",
                "explanation": "कोई ज्ञात दुर्भावनापूर्ण पैटर्न या धोखाधड़ी नहीं पाई गई।",
                "action": "सामान्य उपयोग के लिए ठीक है। फिर भी सतर्कता बनाए रखें।"
            }
        },
        "caretaker": {
            "en": {
                "headline": "Ward Activity: Low Risk Verified",
                "explanation": "Link/message inspected showed no recognizable threats.",
                "action": "No immediate intervention required."
            },
            "kn": {
                "headline": "ಕುಟುಂಬದವರ ಚಟುವಟಿಕೆ: ಕಡಿಮೆ ಅಪಾಯ",
                "explanation": "ಪರಿಶೀಲಿಸಿದ ಸಂದೇಶದಲ್ಲಿ ಯಾವುದೇ ಬೆದರಿಕೆ ಕಂಡುಬಂದಿಲ್ಲ.",
                "action": "ಯಾವುದೇ ತಕ್ಷಣದ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ."
            },
            "hi": {
                "headline": "आश्रित गतिविधि: कम जोखिम सत्यापित",
                "explanation": "जांची गई सामग्री में कोई खतरा नहीं पाया गया।",
                "action": "किसी तत्काल कार्रवाई की आवश्यकता नहीं है।"
            }
        }
    }
}

class DecisionEngine:
    def __init__(self):
        self.reputation_analyzer = ReputationAnalyzer()

    def evaluate(self, raw_input: str, user_mode: str = 'adult', language: str = 'en') -> dict:
        input_text = (raw_input or '').strip()
        mode = user_mode.lower() if user_mode in ['kid', 'adult', 'senior', 'caretaker'] else 'adult'
        lang = language.lower() if language in ['en', 'kn', 'hi'] else 'en'

        # Extract embedded URLs
        extracted_urls = extract_urls_from_text(input_text)
        is_direct_url = False
        if len(extracted_urls) == 1 and (input_text.startswith('http') or ' ' not in input_text):
            is_direct_url = True

        url_analysis = None
        reputation_analysis = None
        message_analysis = None

        target_url = extracted_urls[0] if extracted_urls else None

        # 1. URL Analysis & External Reputation if URL exists
        if target_url:
            url_analysis = analyze_url(target_url)
            reputation_analysis = self.reputation_analyzer.check_reputation(target_url)

        # 2. Message Analysis if text contains more than just a raw URL
        if not is_direct_url or len(input_text.split()) > 3:
            message_analysis = analyze_message(input_text)

        # 3. Aggregate scoring & risk tiering
        aggregate = RiskScorer.calculate_aggregate_risk(
            url_analysis=url_analysis,
            message_analysis=message_analysis,
            reputation_analysis=reputation_analysis
        )

        risk_level = aggregate["level"]
        risk_score = aggregate["score"]
        signals = aggregate["signals"]

        # 4. Generate mode-specific & language-specific explanations
        mode_expl = EXPLANATIONS[risk_level][mode][lang]

        # 5. Determine primary reason
        primary_reason = mode_expl["explanation"]
        if signals:
            top_signal = max(signals, key=lambda s: s.get("severity", 0))
            if mode in ['adult', 'caretaker']:
                primary_reason = f"{mode_expl['explanation']} Primary signal: {top_signal['reason']}"

        # 6. Hashes and previews for privacy
        input_hash = hashlib.sha256(input_text.encode('utf-8')).hexdigest()
        input_preview = (input_text[:80] + '...') if len(input_text) > 80 else input_text

        # 7. Collect external sources status
        external_sources = reputation_analysis.get("sources", []) if reputation_analysis else []

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "headline": mode_expl["headline"],
            "explanation": mode_expl["explanation"],
            "primary_reason": primary_reason,
            "recommendation": mode_expl["action"],
            "signals": signals,
            "user_mode": mode,
            "language": lang,
            "input_preview": input_preview,
            "input_hash": input_hash,
            "input_type": "url" if is_direct_url else ("combined" if target_url else "message"),
            "external_sources": external_sources,
            "status_message": reputation_analysis.get("status_message", "Analyzed using CyberSaarthi risk engine") if reputation_analysis else "Analyzed using CyberSaarthi risk engine",
            "timestamp": datetime.utcnow().isoformat()
        }
