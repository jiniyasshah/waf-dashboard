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
  id: string; // CHANGED: number -> string to match MongoDB ObjectId
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied?: boolean;
}

export interface AddDNSRecordRequest {
  domain_id: string;
  name: string; // "@" for root, "www", "api", etc.
  type: string; // "A", "CNAME", "MX", "TXT"
  content: string; // "1.2.3.4" or target
  ttl?: number; // Optional, default 300
  proxied: boolean; // TRUE = Through WAF, FALSE = Direct
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

// Log types
export interface AttackLog {
  ip: string;
  path: string;
  reason: string;
  action: "Blocked" | "Flagged";
  source: "Rule Engine" | "ML Engine" | "Hybrid";
  tags: string[];
  score: number;
  confidence: number;
  trigger?: string;
  full_request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  timestamp: string;
}
