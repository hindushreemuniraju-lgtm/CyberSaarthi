# CyberSaarthi API Reference

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` — Create account (`name`, `email`/`phone`, `password`, `user_mode`, `preferred_language`, `font_scale`, `voice_enabled`).
- `POST /auth/login` — Sign in (`identifier`, `password`). Returns JWT token.
- `GET /auth/me` — Get authenticated user details & preferences.
- `PUT /auth/me/preferences` — Update preferences (language, mode, font scale, voice, theme).

### Security Scans
- `POST /scan` — Analyze URL or text message.
  - Body: `{ "content": "http://...", "user_mode": "senior", "language": "kn" }`
  - Returns: Risk score (0-100), risk level (SAFE/WARN/BLOCK), signals, headline, explanation, recommendation, external sources status.
  - Auto-triggers Caretaker alerts when `risk_level == BLOCK`.
- `GET /scan/history?limit=20` — Get past scans of current user.
- `GET /scan/<id>` — Inspect a specific scan.

### Caretaker Relationships & Consent
- `GET /caretaker/people` — Caretaker views linked wards, alert statuses, and activity summaries.
- `GET /caretaker/my-caretakers` — Ward views linked caretakers.
- `POST /caretaker/request` — Send linkage invitation (`identifier`, `alert_scope`).
- `POST /caretaker/consent` — Ward or Caretaker updates status (`ACTIVE`/`REVOKED`) or sensitivity.
- `POST /caretaker/revoke` — Revoke caretaker access.
- `GET /caretaker/ward/<ward_id>/scans` — View permitted scans of ward.

### Alerts
- `GET /alerts` — List alerts for current caretaker or ward.
- `PUT /alerts/<id>/read` — Mark alert as read.
- `PUT /alerts/<id>/resolve` — Mark alert as resolved.

### Contacts & Helplines
- `GET /contacts` — List trusted emergency contacts.
- `POST /contacts` — Add trusted contact (`name`, `relationship`, `phone`, `is_emergency`).
- `DELETE /contacts/<id>` — Remove contact.

### Safety Tips & Voice
- `GET /safety-tips?lang=en&mode=all` — Multilingual educational safety tips.
- `POST /voice/transcribe` — Proxy speech recognition to Sarvam AI / Whisper.
- `GET /health` — Service health check.
