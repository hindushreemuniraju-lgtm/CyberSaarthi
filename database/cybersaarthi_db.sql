-- =========================================================================
-- CyberSaarthi Relational Database Management System (MySQL 8.0+)
-- Database: cybersaarthi_db
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =========================================================================

CREATE DATABASE IF NOT EXISTS cybersaarthi_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cybersaarthi_db;

-- -------------------------------------------------------------------------
-- 1. ROLES TABLE (Master RBAC Table)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. USERS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    font_scale VARCHAR(20) NOT NULL DEFAULT 'normal',
    voice_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. USER_ROLES TABLE (Many-to-Many Relationship)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. CARETAKER_LINKS TABLE (Consent-Based Account Linking)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caretaker_links (
    link_id VARCHAR(36) PRIMARY KEY,
    caretaker_user_id VARCHAR(36) NOT NULL,
    linked_user_id VARCHAR(36) NOT NULL,
    consent_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_links_caretaker FOREIGN KEY (caretaker_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_links_ward FOREIGN KEY (linked_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_links_status (consent_status),
    INDEX idx_links_pair (caretaker_user_id, linked_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. LOGIN_HISTORY TABLE (Audit Trail & Brute-Force Monitoring)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_history (
    login_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    login_status VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_login_time (login_time),
    INDEX idx_login_status (login_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. USER PREFERENCES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    theme VARCHAR(32) DEFAULT 'system',
    complexity VARCHAR(20) DEFAULT 'detailed',
    show_technical_details BOOLEAN DEFAULT TRUE,
    animation_level VARCHAR(20) DEFAULT 'standard',
    alert_frequency VARCHAR(20) DEFAULT 'instant',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prefs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. TRUSTED EMERGENCY CONTACTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trusted_contacts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(191),
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 8. SCAN EVENTS (Threat Intelligence Log)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    input_type VARCHAR(20) NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    input_preview VARCHAR(255),
    risk_score INT NOT NULL,
    risk_level VARCHAR(10) NOT NULL,
    primary_reason TEXT NOT NULL,
    signals_json JSON,
    details_json JSON,
    external_sources_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scan_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_scan_hash (input_hash),
    INDEX idx_scan_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 9. ALERTS TABLE (High-Risk Family Notifications)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    scan_event_id VARCHAR(36) NULL,
    ward_id VARCHAR(36) NOT NULL,
    caretaker_id VARCHAR(36) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    title VARCHAR(191) NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_scan FOREIGN KEY (scan_event_id) REFERENCES scan_events(id) ON DELETE SET NULL,
    CONSTRAINT fk_alert_ward FOREIGN KEY (ward_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_caretaker FOREIGN KEY (caretaker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_alert_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 10. SAFETY TIPS (Multilingual Knowledge Base)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS safety_tips (
    id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    target_mode VARCHAR(20) NOT NULL DEFAULT 'all',
    title_en VARCHAR(191) NOT NULL,
    title_kn VARCHAR(191) NOT NULL,
    title_hi VARCHAR(191) NOT NULL,
    content_en TEXT NOT NULL,
    content_kn TEXT NOT NULL,
    content_hi TEXT NOT NULL,
    icon VARCHAR(64) DEFAULT 'shield',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 11. AUDIT LOGS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    action VARCHAR(64) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Insert Master Roles
INSERT INTO roles (role_id, role_name) VALUES
    (1, 'kid'),
    (2, 'adult'),
    (3, 'senior'),
    (4, 'caretaker')
ON DUPLICATE KEY UPDATE role_name=VALUES(role_name);

-- Default Demo Accounts (Bcrypt Hash for 'DemoPass123!': $2b$12$e6m...)
-- 1. Caretaker: suresh_caretaker (caretaker@cybersaarthi.org)
-- 2. Senior: lakshmi_amma (lakshmi@cybersaarthi.org)
-- 3. Kid: riya_kid (riya@cybersaarthi.org)
-- 4. Adult: arun_adult (arun@cybersaarthi.org)
