from backend.app.config.settings import Config

class RiskScorer:
    @staticmethod
    def calculate_aggregate_risk(url_analysis: dict = None, message_analysis: dict = None, reputation_analysis: dict = None) -> dict:
        combined_signals = []
        raw_score = 0

        # Collect URL signals
        if url_analysis and "signals" in url_analysis:
            combined_signals.extend(url_analysis["signals"])
            raw_score += url_analysis.get("calculated_score", 0)

        # Collect Message signals
        if message_analysis and "signals" in message_analysis:
            combined_signals.extend(message_analysis["signals"])
            raw_score += message_analysis.get("calculated_score", 0)

        # Collect Reputation signals
        if reputation_analysis and "signals" in reputation_analysis:
            combined_signals.extend(reputation_analysis["signals"])
            # External reputation threat overrides directly into BLOCK territory
            if reputation_analysis.get("threat_detected"):
                raw_score = max(raw_score, reputation_analysis.get("severity", 85))

        # Contextual synergy booster:
        # If both a high-risk URL signal (e.g. BRAND_IMPERSONATION or IP_HOST) AND a message signal (e.g. BANK_KYC_SUSPENSION or URGENCY) exist:
        url_codes = [s["code"] for s in (url_analysis.get("signals", []) if url_analysis else [])]
        msg_codes = [s["code"] for s in (message_analysis.get("signals", []) if message_analysis else [])]

        if any(c in ['BRAND_IMPERSONATION', 'IP_HOST', 'PUNYCODE_HOMOGRAPH', 'SUSPICIOUS_PATH_KEYWORDS'] for c in url_codes) and \
           any(c in ['BANK_KYC_SUSPENSION', 'CREDENTIAL_OTP_THEFT', 'DIGITAL_ARREST', 'URGENCY_PRESSURE'] for c in msg_codes):
            raw_score += 25

        # Bound score between 0 and 100
        final_score = max(0, min(100, raw_score))

        # Categorize strictly according to centralized project thresholds
        if final_score <= Config.SCORE_SAFE_MAX:
            risk_level = "SAFE"
        elif final_score <= Config.SCORE_WARN_MAX:
            risk_level = "WARN"
        else:
            risk_level = "BLOCK"

        return {
            "score": final_score,
            "level": risk_level,
            "signals": combined_signals
        }
