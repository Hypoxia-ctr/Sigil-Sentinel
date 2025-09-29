export enum View {
  DASHBOARD = 'DASHBOARD',
  FILE_ANALYZER = 'FILE_ANALYZER',
  SYSTEM_MONITOR = 'SYSTEM_MONITOR',
  SECURITY_ADVISOR = 'SECURITY_ADVISOR',
  THREAT_SCANNER = 'THREAT_SCANNER',
  SYSTEM_HARDENER = 'SYSTEM_HARDENER',
  SUBNET_MESSENGER = 'SUBNET_MESSENGER',
  ML_FRAMEWORK_DEMO = 'ML_FRAMEWORK_DEMO',
  AEGIS_HARDENER = 'AEGIS_HARDENER',
  ADMIN_CONSOLE = 'ADMIN_CONSOLE',
  DATA_LOSS_PREVENTION = 'DATA_LOSS_PREVENTION',
  AUDIT_QUEUE = 'AUDIT_QUEUE',
  SYSTEM_LOG = 'SYSTEM_LOG',
  LIVE_CONVERSATION = 'LIVE_CONVERSATION',
}

// ----- Shared Security Types -----

export type Severity = "low" | "medium" | "high" | "critical";

export type Category =
  | "OS"
  | "Network"
  | "Endpoint"
  | "Auth"
  | "Privacy"
  | "Hardening";

// ----- Threat Scanner Types -----

export interface Threat {
  id: string;
  title: string;
  reason?: string;
  detectedAt?: string;
  source?: string;
  severity: Severity;
  details?: string;
  evidence?: Record<string, unknown>;
  explained?: boolean; // has Oracle explanation?
}


// ----- Security Advisor Types -----

export interface Signal {
  key: string;
  label: string;
  category: Category;
  value: unknown;
  at?: string;
  meta?: Record<string, unknown>;
}

export interface FixAction {
  id: string;
  title: string;
  severity: Severity;
  category: Category;
  description: string;
  scripts?: {
    windows?: string;
    linux?: string;
    mac?: string;
  };
  references?: { label: string; href: string }[];
  tags?: string[];
}

export interface AdvicePack {
  id: string;
  title: string;
  evaluate: (signals: Signal[]) => FixAction[];
}

// ----- Data Loss Prevention Types -----
export type DLPAction = 'Block' | 'Audit' | 'Encrypt';

export interface DLPPolicy {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  action: DLPAction;
  enabled: boolean;
}

export interface DLPIncident {
  id: string;
  timestamp: string;
  policyId: string;
  policyName: string;
  contentSnippet: string;
  action: DLPAction;
}

// ----- Oracle / AI Types -----
export type AIInsightState = {
    loading: boolean;
    text: string | null;
    error: string | null;
    feedback: 'up' | 'down' | null;
    fetchedAt?: number;
};

// ----- Audit Queue Types -----
export type AuditQueueItem = {
  id: string;
  title: string;
  severity: Severity;
  timestamp: number;
};