import re
import math
from urllib.parse import urlparse

# Suspicious TLDs commonly abused for low-cost phishing
SUSPICIOUS_TLDS = {
    'tk', 'ml', 'ga', 'cf', 'gq', 'top', 'xyz', 'work', 'click', 'buzz',
    'rest', 'fit', 'icu', 'cam', 'monster', 'surf', 'sbs', 'cfd', 'quest'
}

# Known URL shorteners
SHORTENER_DOMAINS = {
    'bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'cutt.ly', 'rb.gy', 'ow.ly',
    'buff.ly', 'goo.gl', 'shorte.st', 'tiny.cc', 'bc.vc', 'v.gd', 'qr.ae'
}

# High-profile targeted brands in India & globally and their official domains
TARGETED_BRANDS = {
    'sbi': ['onlinesbi.sbi', 'sbi.co.in', 'statebankofindia.com', 'onlinesbi.com', 'bank.sbi'],
    'hdfc': ['hdfcbank.com', 'hdfc.com'],
    'icici': ['icicibank.com'],
    'axis': ['axisbank.com'],
    'pnb': ['pnbindia.in', 'pnbindia.com'],
    'bob': ['bankofbaroda.in', 'bankofbaroda.com'],
    'paytm': ['paytm.com'],
    'phonepe': ['phonepe.com'],
    'gpay': ['google.com', 'pay.google.com'],
    'amazon': ['amazon.in', 'amazon.com'],
    'flipkart': ['flipkart.com'],
    'incometax': ['incometax.gov.in'],
    'aadhaar': ['uidai.gov.in'],
    'indiapost': ['indiapost.gov.in'],
    'netflix': ['netflix.com'],
    'jio': ['jio.com'],
    'airtel': ['airtel.in']
}

SUSPICIOUS_PATH_KEYWORDS = [
    'kyc', 'pan', 'pan-card', 'verify', 'verification', 'update-account',
    'account-block', 'login-confirm', 'claim', 'reward', 'refund', 'lottery',
    'free-recharge', 'apk', 'download-app', 'secure-login', 'ebill', 'power-cut'
]

def calculate_entropy(s: str) -> float:
    """Shannon entropy to detect high-randomness generated strings."""
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob)

def analyze_url(raw_url: str) -> dict:
    signals = []
    total_score = 0
    url = raw_url.strip()

    if not re.match(r'^[a-zA-Z]+://', url):
        parsed = urlparse('http://' + url)
    else:
        parsed = urlparse(url)

    hostname = (parsed.hostname or '').lower()
    path = (parsed.path or '').lower()
    query = (parsed.query or '').lower()

    # 1. IP address in host
    is_ip = bool(re.match(r'^(?:\d{1,3}\.){3}\d{1,3}$', hostname))
    if is_ip:
        signals.append({
            "code": "IP_HOST",
            "severity": 45,
            "title": "IP Address Used Instead of Domain",
            "reason": f"Website uses a raw IP address ({hostname}) instead of a verified organization name."
        })
        total_score += 45

    # 2. Insecure HTTP protocol
    if parsed.scheme == 'http':
        signals.append({
            "code": "HTTP_INSECURE",
            "severity": 15,
            "title": "Unencrypted Connection (HTTP)",
            "reason": "Connection does not use HTTPS encryption. Data transmitted could be intercepted."
        })
        total_score += 15

    # 3. URL Shortener
    if hostname in SHORTENER_DOMAINS:
        signals.append({
            "code": "URL_SHORTENER",
            "severity": 25,
            "title": "URL Shortener Detected",
            "reason": f"Uses a link shortener ({hostname}) which obscures the true destination website."
        })
        total_score += 25

    # 4. Punycode / IDN lookalike
    if 'xn--' in hostname:
        signals.append({
            "code": "PUNYCODE_HOMOGRAPH",
            "severity": 50,
            "title": "Internationalized / Lookalike Domain (Punycode)",
            "reason": f"Domain contains Punycode characters ({hostname}), frequently used in lookalike spoofing attacks."
        })
        total_score += 50

    # 5. Suspicious TLD
    domain_parts = hostname.split('.')
    tld = domain_parts[-1] if len(domain_parts) > 1 else ''
    if tld in SUSPICIOUS_TLDS:
        signals.append({
            "code": "SUSPICIOUS_TLD",
            "severity": 30,
            "title": "High-Risk Top-Level Domain",
            "reason": f"Domain ends with .{tld}, a top-level domain frequently associated with spam and disposable phishing."
        })
        total_score += 30

    # 6. Deceptive Subdomains & Excessive Depth
    if len(domain_parts) >= 4:
        signals.append({
            "code": "EXCESSIVE_SUBDOMAINS",
            "severity": 20,
            "title": "Excessive Subdomains",
            "reason": f"Domain has unusual nested levels ({hostname}), often used to impersonate legitimate brand URLs."
        })
        total_score += 20

    # 7. Brand Impersonation in Domain
    for brand, legit_domains in TARGETED_BRANDS.items():
        # Match brand keyword as a standalone subdomain or part of unofficial host
        if re.search(rf'(^|\.|\-){brand}(\-|\.|$)', hostname) or (brand in hostname):
            is_legit = any(hostname == ld or hostname.endswith('.' + ld) for ld in legit_domains)
            if not is_legit:
                signals.append({
                    "code": "BRAND_IMPERSONATION",
                    "severity": 55,
                    "title": f"Possible Impersonation of {brand.upper()}",
                    "reason": f"Domain name contains '{brand}' but is NOT hosted on an official domain ({', '.join(legit_domains[:2])})."
                })
                total_score += 55
                break

    # 8. Suspicious Keywords in Path/Query
    found_keywords = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in path or kw in query]
    if found_keywords:
        kw_severity = min(40, len(found_keywords) * 15)
        signals.append({
            "code": "SUSPICIOUS_PATH_KEYWORDS",
            "severity": kw_severity,
            "title": "Sensitive Keywords in Web Address",
            "reason": f"Address contains sensitive trigger keywords: {', '.join(found_keywords)}."
        })
        total_score += kw_severity

    # 9. Non-standard ports
    if parsed.port and parsed.port not in [80, 443, 8080]:
        signals.append({
            "code": "NON_STANDARD_PORT",
            "severity": 20,
            "title": "Non-Standard Web Port",
            "reason": f"Connection is directed to port {parsed.port}, unusual for safe consumer websites."
        })
        total_score += 20

    # 10. High Entropy in path/domain (randomized tokens)
    if calculate_entropy(path) > 4.5 and len(path) > 20:
        signals.append({
            "code": "HIGH_ENTROPY_PATH",
            "severity": 15,
            "title": "Randomized URL Path",
            "reason": "URL path contains randomized tokens typical of targeted phishing kits."
        })
        total_score += 15

    return {
        "url": url,
        "hostname": hostname,
        "is_ip": is_ip,
        "signals": signals,
        "calculated_score": min(total_score, 100)
    }
