import requests
import logging
from backend.app.config.settings import Config

logger = logging.getLogger(__name__)

class GoogleSafeBrowsingClient:
    ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

    def __init__(self, api_key: str = None):
        self.api_key = api_key if api_key is not None else Config.GOOGLE_SAFE_BROWSING_API_KEY

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def check_url(self, url: str) -> dict:
        """
        Check URL against Google Safe Browsing API v4.
        Returns structured dict with verified threat status.
        """
        if not self.is_configured():
            return {
                "source": "Google Safe Browsing",
                "configured": False,
                "verified": False,
                "threat_found": False,
                "threat_types": [],
                "message": "Google Safe Browsing API key not configured. Using local CyberSaarthi engine."
            }

        payload = {
            "client": {
                "clientId": "cybersaarthi-safety-companion",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION"
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }

        try:
            response = requests.post(
                f"{self.ENDPOINT}?key={self.api_key}",
                json=payload,
                timeout=4.0
            )
            if response.status_code == 200:
                data = response.json()
                matches = data.get("matches", [])
                threat_found = len(matches) > 0
                threat_types = [m.get("threatType") for m in matches] if threat_found else []
                return {
                    "source": "Google Safe Browsing",
                    "configured": True,
                    "verified": True,
                    "threat_found": threat_found,
                    "threat_types": threat_types,
                    "message": "Threat verified by Google Safe Browsing" if threat_found else "Clean according to Google Safe Browsing"
                }
            else:
                logger.warning(f"Google Safe Browsing returned status {response.status_code}: {response.text}")
                return {
                    "source": "Google Safe Browsing",
                    "configured": True,
                    "verified": False,
                    "threat_found": False,
                    "threat_types": [],
                    "message": f"External service responded with code {response.status_code}. Defaulted to local analysis."
                }
        except Exception as e:
            logger.warning(f"Google Safe Browsing lookup failed: {e}")
            return {
                "source": "Google Safe Browsing",
                "configured": True,
                "verified": False,
                "threat_found": False,
                "threat_types": [],
                "message": "Google Safe Browsing service temporarily unreachable. Local analysis active."
            }
