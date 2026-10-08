# CyberSaarthi — AI & Machine Learning Architecture

## Architectural Philosophy
In **CyberSaarthi**, artificial intelligence is applied with strict cybersecurity rigor:
**An LLM or stochastic model is NEVER solely responsible for the final security classification.**

Cyber threats, financial fraud, and credential-harvesting attacks exploit fast-evolving obfuscation tactics. Solely relying on generative LLM completion risks hallucinations and false negatives.

### Decision Pipeline Architecture
```
User Content (Link / Message)
           │
           ├──────────────────────────────┐
           ▼                              ▼
  [URL Signal Analyzer]       [Message Signal Analyzer]
  • Host/IP detection         • Urgency & fear coercion
  • Punycode / Homograph      • Digital arrest threats
  • Deceptive subdomains      • Fake KYC / bank freeze
  • High entropy / TLDs       • OTP / PIN solicitation
  • Brand impersonation       • Remote desktop app install
           │                              │
           └──────────────┬───────────────┘
                          ▼
           [External Threat Intelligence]
           • Google Safe Browsing API v4
           • VirusTotal v3 Multi-Scanner
           • URLScan.io Historical Verdicts
           (Deterministic Local Engine Fallback)
                          │
                          ▼
           [Risk Scorer & Synergy Booster]
           • Multi-signal synergy calculation
           • Centralized thresholds:
             - 0–29:  SAFE
             - 30–64: WARN
             - 65–100: BLOCK
                          │
                          ▼
           [Multilingual Adaptation Engine]
           • Personalized for Kid, Adult, Senior, Caretaker
           • Natural Regional Phrasing: English, Kannada, Hindi
           • Actionable Recommendations ("What should I do now?")
```

## Future ML Model Integration
The `DecisionEngine` provides a modular plug-and-play interface for machine learning models:
- **Feature Vector Extractor**: Extracts Shannon entropy, lexical character n-grams, suspicious token density, and semantic urgency embeddings.
- **Classification Interface**: An optional `MLRiskAnalyzer` class can be registered to calculate an anomaly score alongside the rule engine.
- **Regional Speech AI**: Abstracted `VoiceService` ready for Sarvam AI or Whisper speech-to-text endpoints.
