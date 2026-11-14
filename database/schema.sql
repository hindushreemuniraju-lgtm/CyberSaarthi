-- ==========================================================
-- CyberSaarthi Database Schema
-- Compatible with MySQL 8.0+ and SQLite 3+
-- Database Name: cybersaarthi_db
-- ==========================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    font_scale VARCHAR(20) NOT NULL DEFAULT 'normal',
    voice_enabled BOOLEAN NOT NULL DEFAULT 0
);

-- 3. User Roles (Many-to-Many Bridge)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- 4. Caretaker Links (Consent-Based Account Linking)
CREATE TABLE IF NOT EXISTS caretaker_links (
    link_id VARCHAR(36) PRIMARY KEY,
    caretaker_user_id VARCHAR(36) NOT NULL,
    linked_user_id VARCHAR(36) NOT NULL,
    consent_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caretaker_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (linked_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Login History (Audit Trail & Rate Limiting Detection)
CREATE TABLE IF NOT EXISTS login_history (
    login_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_status VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 6. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    theme VARCHAR(32) DEFAULT 'system',
    complexity VARCHAR(20) DEFAULT 'detailed',
    show_technical_details BOOLEAN DEFAULT 1,
    animation_level VARCHAR(20) DEFAULT 'standard',
    alert_frequency VARCHAR(20) DEFAULT 'instant',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 7. Trusted Emergency Contacts
CREATE TABLE IF NOT EXISTS trusted_contacts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(191),
    is_emergency BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 8. Scan Events
CREATE TABLE IF NOT EXISTS scan_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    input_type VARCHAR(20) NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    input_preview VARCHAR(255),
    risk_score INT NOT NULL,
    risk_level VARCHAR(10) NOT NULL,
    primary_reason TEXT NOT NULL,
    signals_json TEXT,
    details_json TEXT,
    external_sources_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 9. Family Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    scan_event_id VARCHAR(36),
    ward_id VARCHAR(36) NOT NULL,
    caretaker_id VARCHAR(36) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    title VARCHAR(191) NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scan_event_id) REFERENCES scan_events(id) ON DELETE SET NULL,
    FOREIGN KEY (ward_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (caretaker_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. Safety Tips
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(64) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_scan_events_user ON scan_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_hash ON scan_events(input_hash);
CREATE INDEX IF NOT EXISTS idx_alerts_caretaker ON alerts(caretaker_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_ward ON alerts(ward_id);
CREATE INDEX IF NOT EXISTS idx_caretaker_status ON caretaker_links(consent_status);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
