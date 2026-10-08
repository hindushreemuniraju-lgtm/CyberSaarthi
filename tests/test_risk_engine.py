import pytest
from backend.app.risk_engine.url_analyzer import analyze_url
from backend.app.risk_engine.message_analyzer import analyze_message
from backend.app.risk_engine.decision_engine import DecisionEngine
from backend.app.config.settings import Config

def test_safe_url():
    # Legitimate SBI domain
    result = analyze_url("https://www.onlinesbi.sbi/portal/")
    assert result["calculated_score"] <= Config.SCORE_SAFE_MAX
    assert not any(s["code"] == "BRAND_IMPERSONATION" for s in result["signals"])

def test_phishing_brand_impersonation_url():
    # Brand impersonation of SBI on an unofficial domain with suspicious TLD
    result = analyze_url("http://sbi-kyc-update-portal.xyz/verify-login")
    assert result["calculated_score"] >= Config.SCORE_BLOCK_MIN
    codes = [s["code"] for s in result["signals"]]
    assert "BRAND_IMPERSONATION" in codes
    assert "SUSPICIOUS_TLD" in codes

def test_ip_address_url():
    # IP host URL
    result = analyze_url("http://192.168.1.100/login")
    codes = [s["code"] for s in result["signals"]]
    assert "IP_HOST" in codes
    assert result["calculated_score"] >= 45

def test_shortened_url():
    # URL shortener
    result = analyze_url("https://bit.ly/3xClaimPrize")
    codes = [s["code"] for s in result["signals"]]
    assert "URL_SHORTENER" in codes

def test_punycode_lookalike_url():
    # Punycode spoofing
    result = analyze_url("https://xn--sbi-9ha.com/account")
    codes = [s["code"] for s in result["signals"]]
    assert "PUNYCODE_HOMOGRAPH" in codes
    assert result["calculated_score"] >= 50

def test_digital_arrest_message():
    # Digital arrest threat
    text = "This is CBI officer calling. A customs parcel with illegal drugs is seized in your name. You are under digital arrest. Stay on video call."
    res = analyze_message(text)
    assert res["calculated_score"] >= Config.SCORE_BLOCK_MIN
    assert "DIGITAL_ARREST" in res["scam_categories"]

def test_bank_kyc_urgency_message():
    # KYC suspension with urgency
    text = "Dear Customer, your SBI account will be blocked immediately within 24 hours. Update your KYC here."
    res = analyze_message(text)
    assert res["calculated_score"] >= Config.SCORE_BLOCK_MIN
    assert "BANK_KYC_SUSPENSION" in res["scam_categories"]
    assert "URGENCY_PRESSURE" in res["scam_categories"]

def test_otp_theft_message():
    # OTP theft
    text = "Please share your 6 digit OTP to verify your refund."
    res = analyze_message(text)
    assert "CREDENTIAL_OTP_THEFT" in res["scam_categories"]

def test_decision_engine_multilingual_modes():
    engine = DecisionEngine()
    
    # Block scam in Kannada for Senior
    scam = "http://sbi-kyc-update.xyz/login"
    senior_kn = engine.evaluate(scam, user_mode="senior", language="kn")
    assert senior_kn["risk_level"] == "BLOCK"
    assert "ಅಪಾಯ" in senior_kn["headline"]
    assert "ಕೇರ್‌ಟೇಕರ್‌ಗೆ ಕರೆ ಮಾಡಿ" in senior_kn["recommendation"]

    # Block scam in English for Kid
    kid_en = engine.evaluate(scam, user_mode="kid", language="en")
    assert kid_en["risk_level"] == "BLOCK"
    assert "Let's stop" in kid_en["headline"]
    assert "trusted adult" in kid_en["recommendation"].lower()

    # Block scam in Hindi for Adult
    adult_hi = engine.evaluate(scam, user_mode="adult", language="hi")
    assert adult_hi["risk_level"] == "BLOCK"
    assert "जोखिम" in adult_hi["headline"]
