-- ==========================================================
-- CyberSaarthi Database Schema
-- MySQL 8.0+ Compatible (also compatible with SQLite syntax)
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) UNIQUE,
    phone VARCHAR(32) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_mode ENUM('kid', 'adult', 'senior', 'caretaker') NOT NULL DEFAULT 'adult',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    font_scale VARCHAR(20) NOT NULL DEFAULT 'normal',
    voice_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    theme VARCHAR(32) DEFAULT 'system',
    complexity VARCHAR(20) DEFAULT 'detailed',
    show_technical_details BOOLEAN DEFAULT TRUE,
    animation_level VARCHAR(20) DEFAULT 'standard',
    alert_frequency VARCHAR(20) DEFAULT 'instant',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trusted_contacts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(191),
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caretaker_relationships (
    id VARCHAR(36) PRIMARY KEY,
    caretaker_id VARCHAR(36) NOT NULL,
    ward_id VARCHAR(36) NOT NULL,
    status ENUM('PENDING', 'ACTIVE', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    alert_scope ENUM('BLOCK_ONLY', 'BLOCK_AND_WARN', 'ALL_ACTIVITY') NOT NULL DEFAULT 'BLOCK_ONLY',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caretaker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consents (
    id VARCHAR(36) PRIMARY KEY,
    ward_id VARCHAR(36) NOT NULL,
    caretaker_id VARCHAR(36) NOT NULL,
    consent_type VARCHAR(64) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    FOREIGN KEY (ward_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caretaker_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scan_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    input_type ENUM('url', 'message', 'combined') NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    input_preview VARCHAR(255),
    risk_score INT NOT NULL,
    risk_level ENUM('SAFE', 'WARN', 'BLOCK') NOT NULL,
    primary_reason TEXT NOT NULL,
    signals_json JSON,
    details_json JSON,
    external_sources_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    scan_event_id VARCHAR(36),
    ward_id VARCHAR(36) NOT NULL,
    caretaker_id VARCHAR(36) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH',
    title VARCHAR(191) NOT NULL,
    summary TEXT NOT NULL,
    status ENUM('UNREAD', 'READ', 'RESOLVED') NOT NULL DEFAULT 'UNREAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scan_event_id) REFERENCES scan_events(id) ON DELETE SET NULL,
    FOREIGN KEY (ward_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caretaker_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_tips (
    id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    target_mode ENUM('all', 'kid', 'adult', 'senior', 'caretaker') NOT NULL DEFAULT 'all',
    title_en VARCHAR(191) NOT NULL,
    title_kn VARCHAR(191) NOT NULL,
    title_hi VARCHAR(191) NOT NULL,
    content_en TEXT NOT NULL,
    content_kn TEXT NOT NULL,
    content_hi TEXT NOT NULL,
    icon VARCHAR(64) DEFAULT 'shield',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(64) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_users_mode ON users(user_mode);
CREATE INDEX idx_scan_events_user ON scan_events(user_id);
CREATE INDEX idx_scan_events_hash ON scan_events(input_hash);
CREATE INDEX idx_alerts_caretaker ON alerts(caretaker_id, status);
CREATE INDEX idx_alerts_ward ON alerts(ward_id);
CREATE INDEX idx_caretaker_status ON caretaker_relationships(status);
