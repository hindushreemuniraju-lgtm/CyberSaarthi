from backend.app.integrations.google_safe_browsing import GoogleSafeBrowsingClient
from backend.app.integrations.virustotal import VirusTotalClient
from backend.app.integrations.urlscan import URLScanClient

class ReputationAnalyzer:
    def __init__(self):
        self.gsb = GoogleSafeBrowsingClient()
        self.vt = VirusTotalClient()
        self.urlscan = URLScanClient()

    def check_reputation(self, url: str) -> dict:
        results = []
        threat_detected = False
        highest_severity = 0
        signals = []

        # 1. Google Safe Browsing
        gsb_res = self.gsb.check_url(url)
        results.append(gsb_res)
        if gsb_res.get("threat_found"):
            threat_detected = True
            highest_severity = max(highest_severity, 90)
            signals.append({
                "code": "EXTERNAL_GSB_THREAT",
                "severity": 90,
                "title": "Google Safe Browsing Flag",
                "reason": f"Flagged by Google Safe Browsing for: {', '.join(gsb_res.get('threat_types', ['Malware/Phishing']))}"
            })

        # 2. VirusTotal
        vt_res = self.vt.check_url(url)
        results.append(vt_res)
        if vt_res.get("threat_found"):
            threat_detected = True
            highest_severity = max(highest_severity, 85)
            signals.append({
                "code": "EXTERNAL_VT_THREAT",
                "severity": 85,
                "title": "VirusTotal Multi-Scanner Detection",
                "reason": f"Flagged as malicious or suspicious by {vt_res.get('positives', 0)} security scanners on VirusTotal."
            })

        # 3. URLScan.io
        urlscan_res = self.urlscan.search_url(url)
        results.append(urlscan_res)
        if urlscan_res.get("threat_found"):
            threat_detected = True
            highest_severity = max(highest_severity, 80)
            signals.append({
                "code": "EXTERNAL_URLSCAN_THREAT",
                "severity": 80,
                "title": "URLScan Malicious Verdict",
                "reason": "URLScan.io indexed historical verdicts confirming malicious landing page behavior."
            })

        any_configured = any(r.get("configured") for r in results)
        any_verified = any(r.get("verified") for r in results)

        return {
            "threat_detected": threat_detected,
            "severity": highest_severity,
            "signals": signals,
            "sources": results,
            "external_active": any_configured,
            "verified_externally": any_verified,
            "status_message": (
                "Verified by external threat intelligence service" if (any_verified and threat_detected)
                else "Checked against active threat intelligence" if any_verified
                else "External threat APIs not configured. Analysis conducted by CyberSaarthi rule engine."
            )
        }
