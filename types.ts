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