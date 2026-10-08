-- ==========================================================
-- CyberSaarthi Seed Data
-- ==========================================================

-- Default Users (Password: DemoPass123! hashed with Werkzeug pbkdf2:sha256)
-- Hash for 'DemoPass123!': scrypt:32768:8:1$7U6E5R9Q... or pbkdf2:sha256:600000$h6wD97YhZkZl...
-- We will use a standard verified hash or allow application init to auto-create seeded accounts if empty.

INSERT INTO safety_tips (id, category, target_mode, title_en, title_kn, title_hi, content_en, content_kn, content_hi, icon)
VALUES 
(
    'tip-otp-1',
    'otp_safety',
    'all',
    'Never Share Your OTP',
    'ನಿಮ್ಮ ಒಟಿಪಿಯನ್ನು ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ',
    'अपना ओटीपी कभी किसी के साथ साझा न करें',
    'Banks and government agencies never ask for OTPs or PINs over phone calls or SMS. If someone asks for it, it is a scam.',
    'ಬ್ಯಾಂಕುಗಳು ಅಥವಾ ಸರ್ಕಾರಿ ಸಂಸ್ಥೆಗಳು ಫೋನ್ ಕರೆ ಅಥವಾ SMS ಮೂಲಕ OTP ಅಥವಾ PIN ಕೇಳುವುದಿಲ್ಲ. ಯಾರಾದರೂ ಕೇಳಿದರೆ, ಅದು ವಂಚನೆ.',
    'बैंक या सरकारी एजेंसियां फोन कॉल या एसएमएस पर कभी भी ओटीपी या पिन नहीं मांगती हैं। यदि कोई इसे मांगता है, तो यह धोखाधड़ी है।',
    'key'
),
(
    'tip-kid-1',
    'fake_prizes',
    'kid',
    'No Free Diamonds or Free Phones!',
    'ಯಾವುದೂ ಉಚಿತವಾಗಿ ಸಿಗುವುದಿಲ್ಲ!',
    'कोई मुफ्त फोन या गेम कॉइन नहीं मिलता!',
    'If a game or website says you won a free phone or game coins, ask your mom, dad, or teacher first. Do not click!',
    'ಯಾವುದೇ ಆಟ ಅಥವಾ ವೆಬ್‌ಸೈಟ್ ನಿಮಗೆ ಉಚಿತ ಫೋನ್ ಅಥವಾ ಆಟದ ನಾಣ್ಯಗಳನ್ನು ಗೆದ್ದಿದ್ದೀರಿ ಎಂದು ಹೇಳಿದರೆ, ಮೊದಲು ನಿಮ್ಮ ಪೋಷಕರಿಗೆ ತಿಳಿಸಿ.',
    'अगर कोई गेम या वेबसाइट कहती है कि आपने मुफ्त फोन या गेम सिक्के जीते हैं, तो पहले अपने माता-पिता से पूछें। क्लिक न करें!',
    'gift'
),
(
    'tip-senior-1',
    'digital_arrest',
    'senior',
    'Beware of Fake Police / Digital Arrest Calls',
    'ನಕಲಿ ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ಬೆದರಿಕೆ ಕರೆಗಳಿಂದ ಎಚ್ಚರ',
    'नकली पुलिस या डिजिटल अरेस्ट कॉल से सावधान रहें',
    'Police, CBI, or Customs will NEVER video call you demanding money or telling you to stay home. Cut the call and call your family immediately.',
    'ಪೊಲೀಸರು, ಸಿಬಿಐ ಅಥವಾ ಕಸ್ಟಮ್ಸ್ ಎಂದಿಗೂ ವಿಡಿಯೋ ಕಾಲ್ ಮಾಡಿ ಹಣ ಕೇಳುವುದಿಲ್ಲ ಅಥವಾ ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ಮಾಡುವುದಿಲ್ಲ. ತಕ್ಷಣ ಕರೆ ಕಟ್ ಮಾಡಿ ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಕರೆ ಮಾಡಿ.',
    'पुलिस, सीबीआई या कस्टम कभी भी वीडियो कॉल पर पैसे नहीं मांगते और न ही "डिजिटल अरेस्ट" करते हैं। तुरंत कॉल काटें और अपने परिवार को बताएं।',
    'alert-triangle'
),
(
    'tip-adult-1',
    'job_investment',
    'adult',
    'High Return Part-Time Job Scams',
    'ಅಧಿಕ ಲಾಭದ ಅರೆಕಾಲಿಕ ಉದ್ಯೋಗ ವಂಚನೆಗಳು',
    'अधिक मुनाफे वाले पार्ट-टाइम जॉब घोटाले',
    'Scammers send Telegram/WhatsApp tasks promising Rs.5,000/day for liking videos, then ask for prepayments. Legitimate jobs never ask for deposits.',
    'ಯೂಟ್ಯೂಬ್ ವೀಡಿಯೊ ಲೈಕ್ ಮಾಡಲು ದಿನಕ್ಕೆ 5,000 ರೂ ನೀಡುವ ಟೆಲಿಗ್ರಾಮ್ ಉದ್ಯೋಗಗಳು ವಂಚನೆಗಳಾಗಿವೆ. ಯಾವುದೇ ಅಧಿಕೃತ ಕಂಪನಿ ಠೇವಣಿ ಹಣ ಕೇಳುವುದಿಲ್ಲ.',
    'वीडियो लाइक करने के लिए रोजाना 5000 रुपये देने का वादा करने वाले टेलीग्राम संदेश धोखेबाज होते हैं। कोई भी वैध नौकरी पहले पैसे नहीं मांगती।',
    'briefcase'
);
