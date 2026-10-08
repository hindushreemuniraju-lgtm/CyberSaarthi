# CyberSaarthi — Digital Safety Companion

> **“A safer digital world for everyone.”**  
> *VTU Community / Societal Project — Cyber Safety Companion*

---

## 1. Project Overview

CyberSaarthi is an adaptive cyber-safety companion engineered to protect citizens from deceptive links, financial phishing, digital arrest threats, and social-engineering scams.

Rather than providing a generic one-size-fits-all dashboard, CyberSaarthi dynamically adapts its user interface, language complexity, interaction paradigms, and protective controls across **four genuinely distinct personas**:

1. **🧒 Kids**: An interactive storybook adventure with mascot *Chotu Saarthi*, quiz challenges, star rewards, safety badges, and a direct *"Ask My Trusted Adult"* intervention.
2. **👩 Adults**: An elegant, minimal, and professional security console featuring quantitative risk scores (0–100), detected technical signals (Punycode, entropy, deceptive subdomains), and threat intelligence feeds.
3. **👵 Seniors**: A warm, high-contrast, large-button, voice-assisted interface in natural regional languages (**Kannada**, **Hindi**, **English**). Immediate STOP banners, audio readouts, and direct family speed-dials without intimidating technical jargon.
4. **👨‍👩‍👧 Caretaker**: A family safety command center built on explicit mutual consent, sensitivity thresholds, permitted ward scan inspection, and instant critical alerts.

Underneath all four experiences runs **ONE deterministic risk engine**, **ONE unified database schema**, **ONE authentication system**, and **ONE multilingual foundation**.

---

## 2. Protected Flow & Scope Rule

CyberSaarthi does **NOT** falsely claim to intercept operating-system-level WhatsApp, SMS, or phone calls without user permission.

The verified protected flow is:
```
User brings / pastes / speaks a link or message into CyberSaarthi
   ▼
CyberSaarthi analyzes it (URL patterns + Message triggers + Threat Intelligence)
   ▼
Generates risk score (0–100) & Category: SAFE (0–29) | WARN (30–64) | BLOCK (65–100)
   ▼
Explains WHY in the user's native language & complexity level
   ▼
Recommends immediate actionable steps ("What should I do now?")
   ▼
Optionally alerts an approved Caretaker if mutual consent is active
```

---

## 3. Technology Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Lucide React, i18next
- **Backend**: Python 3.14, Flask 3, Flask-CORS, SQLAlchemy 2.1, PyJWT, Werkzeug Security, Requests
- **Database**: MySQL 8.0+ (with zero-downtime automatic fallback to SQLite for local development)
- **Threat Intelligence**: Google Safe Browsing API v4, VirusTotal v3, URLScan.io
- **Voice / Speech**: Web Speech API (Recognition + Synthesis) with backend proxy abstraction ready for Sarvam AI / Whisper

---

## 4. Directory Structure

```
CyberSaarthi/
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, VoiceAssistant, ResultCard, Modals
│   │   ├── pages/                 # WelcomePage, AuthPage
│   │   ├── modes/
│   │   │   ├── kids/              # KidsHome, KidsStoryCard
│   │   │   ├── adults/            # AdultDashboard
│   │   │   ├── seniors/           # SeniorHome
│   │   │   └── caretaker/         # CaretakerDashboard
│   │   ├── services/              # api.ts, voiceService.ts
│   │   ├── context/               # AuthContext, UserExperienceContext
│   │   ├── i18n/                  # locales (en.json, kn.json, hi.json)
│   │   ├── types/                 # TypeScript interfaces
│   │   └── styles/                # index.css (Accessibility font scaling)
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── config/                # settings.py (Centralized 0-29, 30-64, 65-100 thresholds)
│   │   ├── models/                # User, Contact, Relationship, Alert, ScanEvent
│   │   ├── risk_engine/           # URL analyzer, Message analyzer, Reputation, DecisionEngine
│   │   ├── integrations/          # Google Safe Browsing, VirusTotal, URLScan
│   │   ├── routes/                # auth, scan, caretaker, alert, contacts, tips, voice
│   │   └── utils/                 # JWT auth helpers, sanitizer
│   ├── requirements.txt
│   └── run.py
│
├── database/
│   ├── schema.sql                 # MySQL schema with constraints and indexes
│   └── seed.sql                   # Realistic sample data & safety tips
│
├── ai/
│   └── README.md                  # Rigorous AI/ML architecture documentation
│
├── tests/
│   ├── test_risk_engine.py        # Automated URL, message & multilingual tests
│   └── test_api_and_flows.py      # Automated Senior-Caretaker alert flow test
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── API_REFERENCE.md
│
├── .env.example
└── README.md
```

---

## 5. Getting Started (Windows PowerShell)

### Prerequisites
- Node.js v18+ (verified on v24.21.0)
- Python 3.10+ (verified on Python 3.14)
- (Optional) MySQL 8.0 running locally

### Step 1: Clone or Navigate to the Workspace
```powershell
cd C:\CYBERSARTHI
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `backend\.env`:
```powershell
Copy-Item .env.example backend\.env
```
*Note: External threat intelligence API keys (Google Safe Browsing, VirusTotal) are optional. If omitted, CyberSaarthi runs smoothly using its deterministic internal rule engine.*

### Step 3: Run the Automated Backend Tests
```powershell
.\backend\venv\Scripts\python.exe -m pytest tests/
```
*(All 11 automated test suites covering Safe/Warn/Block URL parsing, Digital arrest detection, Multilingual outputs, and Caretaker alerting will execute).*

### Step 4: Start the Backend Server
```powershell
.\backend\venv\Scripts\python.exe backend\run.py
```
Backend starts on **`http://localhost:5050`**.  
On first launch, default demo persona accounts and safety tips are automatically seeded into the database.

### Step 5: Start the Frontend Application
Open a second PowerShell terminal:
```powershell
cd C:\CYBERSARTHI\frontend
npm run dev
```
Open **`http://localhost:5175`** in your browser.

---

## 6. Pre-Configured Demo Persona Accounts

For quick demonstrations and reviews, the database is pre-seeded with four ready-to-test persona accounts (Password for all: `DemoPass123!`):

| Persona | Email / Identifier | Mode | Default Language | Key Features |
|---|---|---|---|---|
| **👵 Lakshmi Amma** | `lakshmi@cybersaarthi.org` | Senior | Kannada (`kn`) | Large buttons, voice readout, connected to Caretaker Suresh |
| **👨‍👩‍👧 Suresh Kumar** | `caretaker@cybersaarthi.org` | Caretaker | English (`en`) | Linked to Lakshmi and Riya, receives instant alerts |
| **🧒 Riya** | `riya@cybersaarthi.org` | Kid | English (`en`) | Chotu Saarthi stories, quiz badges, "Ask Adult" button |
| **👩 Arun Sharma** | `arun@cybersaarthi.org` | Adult | English (`en`) | Modern dark/light dashboard, technical signals breakdown |

*You can also click any 1-Click Demo Profile on the Sign In page or welcome screen to switch personas instantly.*

---

## 7. Verifying the End-to-End Caretaker Alert Flow

You can test the entire societal protection flow:
1. Open CyberSaarthi and switch to **Senior Mode** (Lakshmi Amma) with **Kannada** language.
2. In the input box, paste a suspicious bank link:  
   `http://sbi-kyc-update-portal.xyz/verify-login`
3. Click **ಪರಿಶೀಲಿಸಿ (Check Now)** or click **ಮಾತನಾಡಿ (Speak)**.
4. The system calculates a high risk score (**BLOCK**), displays the result in dignified Kannada, and reads it aloud with voice synthesis.
5. CyberSaarthi automatically dispatches a critical alert to Caretaker Suresh.
6. Switch to **Caretaker Mode**: Suresh's dashboard displays the unread alert:  
   *“High-Risk Alert for Lakshmi Amma: ಅಪಾಯ: ದಯವಿಟ್ಟು ಇದನ್ನು ತೆರೆಯಬೇಡಿ”*.
7. Suresh can call Lakshmi or mark the alert as resolved.

---

## 8. Automated Quality Checklist

- [x] Backend starts on port 5050
- [x] Frontend builds cleanly with zero TypeScript errors
- [x] Database tables and indexes initialize automatically
- [x] Full JWT registration and login working
- [x] Centralized thresholds strictly enforced (0–29 SAFE, 30–64 WARN, 65–100 BLOCK)
- [x] Kids interface is playful with stories, badges, and protective defaults
- [x] Senior interface features high-contrast, large touch targets, voice guidance, and zero jargon
- [x] Adult interface provides in-depth technical signals and threat intelligence verification
- [x] Caretaker interface enforces explicit mutual consent, sensitivity filtering, and alert resolution
- [x] Natural translations for English, Kannada, and Hindi
- [x] Indian National Cyber Crime Helpline (1930) integrated
- [x] Graceful fallback when external threat APIs or microphone permissions are unavailable
- [x] All 11 pytest automated tests passing
