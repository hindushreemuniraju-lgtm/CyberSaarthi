import base64
import requests
import logging
from backend.app.config.settings import Config

logger = logging.getLogger(__name__)

class VirusTotalClient:
    ENDPOINT = "https://www.virustotal.com/api/v3/urls"

    def __init__(self, api_key: str = None):
        self.api_key = api_key if api_key is not None else Config.VIRUSTOTAL_API_KEY

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def check_url(self, url: str) -> dict:
        """
        Check URL against VirusTotal v3 API.
        """
        if not self.is_configured():
            return {
                "source": "VirusTotal",
                "configured": False,
                "verified": False,
                "threat_found": False,
                "positives": 0,
                "total_scanners": 0,
                "message": "VirusTotal API key not configured. Using local CyberSaarthi engine."
            }

        try:
            # VT URL identifier: base64 without padding
            url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
            headers = {"x-apikey": self.api_key}
            response = requests.get(
                f"{self.ENDPOINT}/{url_id}",
                headers=headers,
                timeout=4.0
            )

            if response.status_code == 200:
                data = response.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                harmless = stats.get("harmless", 0)
                undetected = stats.get("undetected", 0)
                total = malicious + suspicious + harmless + undetected

                threat_found = (malicious + suspicious) >= 2
                return {
                    "source": "VirusTotal",
                    "configured": True,
                    "verified": True,
                    "threat_found": threat_found,
                    "positives": malicious + suspicious,
                    "total_scanners": total,
                    "stats": stats,
                    "message": f"VirusTotal engines flagged: {malicious} malicious, {suspicious} suspicious" if threat_found else "No significant flags on VirusTotal"
                }
            elif response.status_code == 404:
                return {
                    "source": "VirusTotal",
                    "configured": True,
                    "verified": True,
                    "threat_found": False,
                    "positives": 0,
                    "total_scanners": 0,
                    "message": "URL not previously indexed on VirusTotal."
                }
            else:
                logger.warning(f"VirusTotal responded with code {response.status_code}")
                return {
                    "source": "VirusTotal",
                    "configured": True,
                    "verified": False,
                    "threat_found": False,
                    "positives": 0,
                    "total_scanners": 0,
                    "message": f"VirusTotal responded with code {response.status_code}. Defaulted to local analysis."
                }
        except Exception as e:
            logger.warning(f"VirusTotal lookup error: {e}")
            return {
                "source": "VirusTotal",
                "configured": True,
                "verified": False,
                "threat_found": False,
                "positives": 0,
                "total_scanners": 0,
                "message": "VirusTotal service temporarily unreachable. Local analysis active."
            }
