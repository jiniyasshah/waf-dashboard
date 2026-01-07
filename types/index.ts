// User types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user?: User;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  user?: User;
}

// System status types
export interface ServiceStatus {
  status: string;
  cpu: string;
  memory: string;
  network: string;
}

export interface SystemStatus {
  gateway: ServiceStatus;
  database: ServiceStatus;
  ml_scorer: ServiceStatus;
}

// Domain types
export interface Domain {
  id: string;
  user_id: string;
  name: string;
  // REMOVED: proxied: boolean;
  nameservers: string[];
  status: "active" | "pending_verification";
  created_at: string;
}

export interface AddDomainRequest {
  name: string;
}

export interface VerifyDomainResponse {
  status: string;
  message: string;
  found_records?: any[];
}

// DNS Record types
export interface DNSRecord {
  id: string;
  domain_id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  origin_ssl?: boolean; // [NEW] Add this field
  created_at: string;
}

export interface AddDNSRecordRequest {
  domain_id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  origin_ssl?: boolean; // [NEW] Add this field
}

// Rule types
export interface RuleCondition {
  field: "path" | "query" | "body" | "header";
  operator: "contains" | "regex" | "equals";
  value: string;
}

export interface RuleOnMatch {
  score_add?: number;
  tags: string[];
  hard_block: boolean;
}

export interface Rule {
  id: string;
  owner_id: string;
  name: string;
  conditions: RuleCondition[];
  on_match: RuleOnMatch;
  enabled: boolean;
}

export interface AddCustomRuleRequest {
  name: string;
  conditions: RuleCondition[];
  on_match: RuleOnMatch;
}

export interface ToggleRuleRequest {
  id: string;
  domain_id?: string;
  enabled: boolean;
}

export interface AttackLog {
  _id?: string;
  timestamp: string;
  ip: string;
  request_path: string; // Matches json:"request_path"
  reason: string;
  action: "Blocked" | "Flagged" | "Monitor";
  source: "Rule Engine" | "ML Engine" | "Hybrid";
  tags: string[];
  score: number;
  ml_confidence?: number; // Matches json:"ml_confidence"
  trigger_payload?: string; // Matches json:"trigger_payload"
  domain_id?: string;
  request?: {
    method: string;
    url: string;
    // Go headers map to string arrays
    headers: Record<string, string[]>;
    body: string;
    proto?: string;
  };
}

// Pagination Wrapper
export interface PaginatedLogsResponse {
  data: AttackLog[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export interface ToggleDNSRecordOriginSSLRequest {
  domain_id: string;
  record_id: string;
  origin_ssl: boolean;
}
