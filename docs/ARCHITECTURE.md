# CyberSaarthi System Architecture

## Overview
CyberSaarthi is a full-stack Cyber Safety Companion built for societal and community protection (VTU Societal Project). It delivers real-time threat detection for suspicious links and scam messages through **four genuinely distinct user experiences**:
1. **Kids**: Fun story adventures with mascot *Chotu Saarthi*, quiz rewards, protective defaults, and a direct "Ask My Trusted Adult" intervention.
2. **Adults**: Clean, professional security console with risk gauges, technical signals (entropy, punycode, brand impersonation), and external intelligence feeds.
3. **Seniors**: High-contrast, large-button, voice-assisted interface in natural Kannada, Hindi, and English. Clear STOP banners and direct caretaker call buttons without confusing jargon.
4. **Caretakers**: Family protection dashboard with explicit mutual consent, sensitivity thresholds, permitted ward scan inspection, and instant critical alerts.

## Technology Stack
- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Lucide Icons, i18next
- **Backend**: Python 3.14 / Flask, SQLAlchemy 2.1, PyJWT, Werkzeug security
- **Database**: MySQL 8.0+ (with automatic development fallback to SQLite)
- **Threat Intelligence**: Google Safe Browsing API v4, VirusTotal v3, URLScan.io
- **Speech**: Browser Web Speech API (STT & TTS) with backend abstraction for Sarvam AI / Whisper

## Data Flow & Threat Detection Flow
1. **User Input**: User inputs text or URL (via keyboard, clipboard paste, or voice).
2. **Sanitization**: Content is sanitized against XSS while preserving attack payloads for detection.
3. **Inspection**:
   - URL Analyzer tests hostname, IP formatting, Punycode, TLDs, and brand impersonation.
   - Message Analyzer inspects coercive triggers: Digital arrest, fake KYC, OTP theft, task scams.
   - Reputation Analyzer queries configured external threat APIs. If keys are omitted, the local rule engine provides analysis without fabricating results.
4. **Scoring**: Weighted score is bounded 0–100 and mapped to `SAFE`, `WARN`, or `BLOCK`.
5. **Personalization**: Explanations and actionable recommendations are formulated in the target user mode and language.
6. **Alert Escalation**: If risk is `BLOCK` (or configured `WARN`), active caretaker relationships receive an immediate security alert.
