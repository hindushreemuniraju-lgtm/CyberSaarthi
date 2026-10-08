export type UserMode = 'kid' | 'adult' | 'senior' | 'caretaker';
export type Language = 'en' | 'kn' | 'hi';
export type RiskLevel = 'SAFE' | 'WARN' | 'BLOCK';
export type FontScale = 'normal' | 'large' | 'xlarge';

export interface UserPreferences {
  id?: string;
  theme: string;
  complexity: 'simple' | 'detailed';
  show_technical_details: boolean;
  animation_level: 'none' | 'reduced' | 'standard';
  alert_frequency?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  user_mode: UserMode;
  preferred_language: Language;
  font_scale: FontScale;
  voice_enabled: boolean;
  preferences?: UserPreferences;
}

export interface DetectedSignal {
  code: string;
  severity: number;
  title: string;
  reason: string;
}

export interface ExternalSourceResult {
  source: string;
  configured: boolean;
  verified: boolean;
  threat_found: boolean;
  message: string;
  positives?: number;
  total_scanners?: number;
}

export interface ScanResult {
  scan_id?: string;
  risk_score: number;
  risk_level: RiskLevel;
  headline: string;
  explanation: string;
  primary_reason: string;
  recommendation: string;
  signals: DetectedSignal[];
  user_mode: UserMode;
  language: Language;
  input_preview: string;
  input_type: string;
  external_sources: ExternalSourceResult[];
  status_message: string;
  timestamp: string;
}

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_emergency: boolean;
  created_at: string;
}

export interface WardPerson {
  relationship_id: string;
  ward_id: string;
  ward_name: string;
  ward_mode: UserMode;
  ward_email?: string;
  ward_phone?: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  alert_scope: 'BLOCK_ONLY' | 'BLOCK_AND_WARN' | 'ALL_ACTIVITY';
  unread_alerts_count: number;
  last_activity?: string;
  last_risk_level?: string;
}

export interface AlertItem {
  id: string;
  scan_event_id?: string;
  ward_id: string;
  ward_name: string;
  ward_mode: UserMode;
  caretaker_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  summary: string;
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  created_at: string;
}

export interface SafetyTipItem {
  id: string;
  category: string;
  target_mode: string;
  title: string;
  content: string;
  icon: string;
  created_at?: string;
}
