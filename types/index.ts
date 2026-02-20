// type: uploaded file
// fileName: types/index.ts

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

// Matches backend payload in data field
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

// [UPDATED] Stats Interface
export interface DomainStats {
  total_requests: number;
  flagged_requests: number;
  blocked_requests: number;
}

// Domain types
export interface Domain {
  id: string;
  user_id: string;
  name: string;
  nameservers: string[];
  status: "active" | "pending_verification";
  stats?: DomainStats; // [UPDATED] Added stats field
  created_at: string;
}

export interface AddDomainRequest {
  name: string;
}

export interface VerifyDomainResponse {
  status: string;
  message: string;
  found_records?: any[];
  details?: any;
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
  origin_ssl?: boolean;
  created_at: string;
}

export interface AddDNSRecordRequest {
  domain_id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  origin_ssl?: boolean;
}

export interface ToggleDNSRecordOriginSSLRequest {
  domain_id: string;
  record_id: string;
  origin_ssl: boolean;
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
  user_id: string;
  domain_id: string;
  timestamp: string;
  ip: string; // The Go struct uses 'ip', NOT 'ip_address'
  request_path: string;
  reason: string;
  source: string;
  tags: string[];
  action: "Blocked" | "Flagged"; // Removed "Monitor"
  score: number;
  ml_confidence?: number;
  trigger_payload?: string;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string[]>;
    body: string;
  };
}

export interface PaginatedLogsResponse {
  logs: AttackLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  // New backend-calculated stats
  total_events: number;
  blocked: number;
  flagged: number;
}
