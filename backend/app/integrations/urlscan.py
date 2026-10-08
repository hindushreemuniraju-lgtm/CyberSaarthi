import requests
import logging
from backend.app.config.settings import Config

logger = logging.getLogger(__name__)

class URLScanClient:
    SEARCH_ENDPOINT = "https://urlscan.io/api/v1/search/"

    def __init__(self, api_key: str = None):
        self.api_key = api_key if api_key is not None else Config.URLSCAN_API_KEY

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def search_url(self, url: str) -> dict:
        """
        Search URLScan.io historical verdicts for URL or domain.
        """
        if not self.is_configured():
            return {
                "source": "URLScan.io",
                "configured": False,
                "verified": False,
                "threat_found": False,
                "message": "URLScan API key not configured. Using local CyberSaarthi engine."
            }

        try:
            headers = {"API-Key": self.api_key}
            query = f'page.url:"{url}"'
            response = requests.get(
                self.SEARCH_ENDPOINT,
                headers=headers,
                params={"q": query, "size": 3},
                timeout=4.0
            )

            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                threat_found = False
                verdicts = []
                for r in results:
                    verdict = r.get("verdicts", {}).get("overall", {})
                    if verdict.get("malicious"):
                        threat_found = True
                        verdicts.append(verdict)

                return {
                    "source": "URLScan.io",
                    "configured": True,
                    "verified": True,
                    "threat_found": threat_found,
                    "matches_found": len(results),
                    "message": "Malicious indicators found on URLScan" if threat_found else "No malicious verdict on URLScan"
                }
            else:
                return {
                    "source": "URLScan.io",
                    "configured": True,
                    "verified": False,
                    "threat_found": False,
                    "message": f"URLScan returned code {response.status_code}."
                }
        except Exception as e:
            logger.warning(f"URLScan lookup failed: {e}")
            return {
                "source": "URLScan.io",
                "configured": True,
                "verified": False,
                "threat_found": False,
                "message": "URLScan service temporarily unreachable."
            }
