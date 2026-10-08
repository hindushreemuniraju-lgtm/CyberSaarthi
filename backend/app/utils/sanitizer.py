import re
import html
from urllib.parse import urlparse

def sanitize_text(text: str, max_length: int = 4000) -> str:
    """Sanitize message content safely without corrupting security scan signals."""
    if not text:
        return ""
    # Strip dangerous HTML entities while keeping plain text intact
    cleaned = html.escape(text.strip()[:max_length])
    return cleaned

def normalize_url(url: str) -> str:
    """Normalize URL string for consistent analysis."""
    if not url:
        return ""
    url = url.strip()
    # Check if scheme exists
    if not re.match(r'^[a-zA-Z]+://', url):
        # Default to http:// for parsing purposes if missing
        url = 'http://' + url
    return url

def extract_urls_from_text(text: str) -> list:
    """Find any embedded URLs in a message."""
    if not text:
        return []
    url_pattern = r'(https?://[^\s<>"]+|www\.[^\s<>"]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/[^\s<>"]*)?)'
    matches = re.findall(url_pattern, text)
    cleaned_urls = []
    for m in matches:
        # Strip trailing punctuation often copied along with links
        m_clean = re.sub(r'[\.,;!?\)]+$', '', m)
        if len(m_clean) > 3 and '.' in m_clean:
            cleaned_urls.append(normalize_url(m_clean))
    return cleaned_urls
