import { toast } from "sonner";
import { PaginatedLogsResponse } from "@/types";
import { useAuthStore } from "@/lib/auth-store";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthCheckResponse,
  SystemStatus,
  Domain,
  AddDomainRequest,
  VerifyDomainResponse,
  DNSRecord,
  AddDNSRecordRequest,
  Rule,
  AddCustomRuleRequest,
  ToggleRuleRequest,
  AttackLog,
} from "@/types";

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Check if API URL is configured
export function isApiConfigured(): boolean {
  return !!API_URL;
}

// Get the API URL (for display purposes)
export function getApiUrl(): string {
  return API_URL;
}

interface ApiCallOptions extends RequestInit {
  suppressErrorToast?: boolean;
}

// Standard Backend Response Wrapper
interface StandardResponse<T> {
  status: string;
  message?: string;
  data?: T;
}

// Generic API call handler with improved error handling
async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<T | null> {
  if (!API_URL) {
    if (!options.suppressErrorToast) {
      toast.error(
        "API URL not configured. Please set NEXT_PUBLIC_API_URL in .env.local",
      );
    }
    return null;
  }
  const { suppressErrorToast, ...fetchOptions } = options;
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });
    if (response.status === 401) {
      const isLoginRequest = endpoint === "/api/auth/login";
      const isAuthCheck = endpoint === "/api/auth/check";
      if (!isAuthCheck && !isLoginRequest) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return null;
      }
      if (isAuthCheck) return null;
    }
    if (response.status === 401 && endpoint === "/api/auth/check") {
      return null;
    }
    let rawData: any = null;
    const contentType = response.headers.get("content-type");
    let textBody = "";
    try {
      textBody = await response.text();
      const trimmed = textBody.trim();
      if (
        textBody &&
        (contentType?.includes("application/json") ||
          trimmed.startsWith("{") ||
          trimmed.startsWith("["))
      ) {
        rawData = JSON.parse(textBody);
      }
    } catch {}
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      if (rawData && typeof rawData === "object") {
        errorMessage =
          rawData.message || rawData.error || rawData.details || errorMessage;
      } else if (textBody) {
        errorMessage = textBody.trim();
      }
      if (!suppressErrorToast) {
        toast.error(errorMessage);
      }
      return null;
    }
    if (rawData && rawData.status === "success") {
      if (rawData.data !== undefined) {
        return rawData.data as T;
      }
      if (rawData.message) {
        return { message: rawData.message } as unknown as T;
      }
      return {} as T;
    }
    return rawData as T;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    if (!suppressErrorToast) {
      toast.error("Network error. Please try again.");
    }
    return null;
  }
}

// Auth API calls
export async function register(
  data: RegisterRequest,
): Promise<AuthResponse | null> {
  return apiCall<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<AuthResponse | null> {
  return apiCall<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function checkAuth(): Promise<AuthCheckResponse | null> {
  return apiCall<AuthCheckResponse>("/api/auth/check", {
    suppressErrorToast: true,
  });
}

export async function logout(): Promise<void> {
  await apiCall("/api/auth/logout", { method: "POST" });
}

// System status
export async function getSystemStatus(): Promise<SystemStatus | null> {
  return apiCall<SystemStatus>("/api/system/status");
}

// Domain API calls
export async function getDomains(): Promise<Domain[] | null> {
  return apiCall<Domain[]>("/api/domains");
}

export async function addDomain(
  data: AddDomainRequest,
): Promise<Domain | null> {
  return apiCall<Domain>("/api/domains/add", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyDomain(
  domainId: string,
): Promise<VerifyDomainResponse | null> {
  return apiCall<VerifyDomainResponse>(`/api/domains/verify?id=${domainId}`, {
    method: "POST",
  });
}

// DNS Record API calls
export async function getDNSRecords(
  domainId: string,
): Promise<DNSRecord[] | null> {
  return apiCall<DNSRecord[]>(`/api/dns/records?domain_id=${domainId}`);
}

export async function addDNSRecord(
  data: AddDNSRecordRequest,
): Promise<any | null> {
  return apiCall("/api/dns/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteDNSRecord(
  domainId: string,
  recordId: string,
): Promise<any | null> {
  return apiCall(
    `/api/dns/records?domain_id=${domainId}&record_id=${recordId}`,
    {
      method: "DELETE",
    },
  );
}

// Standard Proxy Toggle
export async function toggleDNSRecordProxy(
  domainId: string,
  recordId: string,
  proxied: boolean,
): Promise<any | null> {
  return apiCall(
    `/api/dns/records?domain_id=${domainId}&record_id=${recordId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        action: "toggle_proxy",
        proxied: proxied,
      }),
    },
  );
}

// Origin SSL Toggle
export async function toggleDNSRecordOriginSSL(
  domainId: string,
  recordId: string,
  originSSL: boolean,
): Promise<any | null> {
  return apiCall(
    `/api/dns/records?domain_id=${domainId}&record_id=${recordId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        action: "toggle_origin_ssl",
        origin_ssl: originSSL,
      }),
    },
  );
}

// Rules API calls
export async function getGlobalRules(
  domainId?: string,
): Promise<Rule[] | null> {
  const query = domainId ? `?domain_id=${domainId}` : "";
  return apiCall<Rule[]>(`/api/rules/global${query}`);
}

export async function getCustomRules(
  domainId?: string,
): Promise<Rule[] | null> {
  const query = domainId ? `?domain_id=${domainId}` : "";
  return apiCall<Rule[]>(`/api/rules/custom${query}`);
}

export async function addCustomRule(
  data: AddCustomRuleRequest,
): Promise<any | null> {
  return apiCall("/api/rules/custom/add", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomRule(ruleId: string): Promise<any | null> {
  return apiCall(`/api/rules/custom/delete?id=${ruleId}`, {
    method: "DELETE",
  });
}

export interface TrafficPoint {
  time: string;
  total: number;
  threats: number;
}

export async function getTrafficHistory(): Promise<TrafficPoint[] | null> {
  return apiCall<TrafficPoint[]>("/api/system/traffic-history");
}

// [FIXED] Manually map 'id' to 'rule_id' to match backend expectation
export async function toggleRule(data: ToggleRuleRequest): Promise<any | null> {
  return apiCall("/api/rules/toggle", {
    method: "POST",
    body: JSON.stringify({
      rule_id: data.id, // Mapped here
      domain_id: data.domain_id,
      enabled: data.enabled,
    }),
  });
}

export async function getLogs(
  page: number = 1,
  limit: number = 20,
  domainId?: string,
  action?: string,
  ip?: string,
  source?: string,
): Promise<PaginatedLogsResponse | null> {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (domainId && domainId !== "all") {
    params.append("domain_id", domainId);
  }
  if (action && action !== "All") {
    params.append("action", action);
  }
  if (ip) {
    params.append("ip", ip);
  }
  // [UPDATED] Append source instead of attack_type
  if (source && source !== "All") {
    params.append("source", source);
  }

  return apiCall<PaginatedLogsResponse>(`/api/logs?${params.toString()}`, {
    method: "GET",
  });
}

// SSE for real-time logs
export function createLogStream(
  onMessage: (log: AttackLog) => void,
): EventSource | null {
  if (!API_URL) {
    toast.error("API URL not configured.");
    return null;
  }

  try {
    const eventSource = new EventSource(`${API_URL}/api/logs/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        onMessage(log);
      } catch (error) {
        console.error("Failed to parse log:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return eventSource;
  } catch (error) {
    console.error("Failed to create SSE connection:", error);
    return null;
  }
}

export async function deleteDomain(domainId: string): Promise<any | null> {
  return apiCall(`/api/domains/delete?id=${domainId}`, {
    method: "DELETE",
  });
}

export async function verifyEmail(token: string): Promise<any | null> {
  return apiCall(`/api/auth/verify?token=${token}`, {
    method: "GET",
  });
}

export async function updateEmail(newEmail: string): Promise<any | null> {
  return apiCall("/api/auth/email/update", {
    method: "POST",
    body: JSON.stringify({ new_email: newEmail }),
  });
}

export async function updatePassword(
  oldPassword: string,
  newPassword: string,
): Promise<any | null> {
  return apiCall("/api/auth/password/update", {
    method: "POST",
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
}

export async function verifyEmailChange(token: string): Promise<any | null> {
  return apiCall(`/api/auth/email/verify-change?token=${token}`, {
    method: "GET",
  });
}

export async function forgotPassword(email: string): Promise<any | null> {
  return apiCall("/api/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<any | null> {
  return apiCall("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({
      token: token,
      new_password: newPassword,
    }),
  });
}
