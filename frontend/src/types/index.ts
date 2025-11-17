export interface Contact {
  id?: number;
  phone: string;
  optIn: boolean;
  opt_in?: boolean; // Legacy support
  tags?: string | null;
  countryCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  lastContactedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  id: number;
  name: string;
  language: string;
  category: string;
  parameters: number;
  previewText?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CountryLimit {
  id: number;
  countryCode: string;
  countryName: string;
  maxPerSecond: number;
  maxConcurrency: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  templateId?: number | null;
  templateName?: string | null;
  bodyText?: string | null;
  tag?: string | null;
  total: number;
  sent: number;
  failed: number;
  dryRun: boolean;
  createdAt: string;
}

export interface UploadHistory {
  id: number;
  filename: string;
  total: number;
  imported: number;
  skipped: number;
  mode: string;
  createdAt: string;
}

export interface SendRequest {
  limit?: number;
  bodyText?: string;
  tag?: string;
  dryRun?: boolean;
  components?: any[];
  templateId?: number | null;
}

export interface SendResult {
  to: string;
  ok: boolean;
  id?: string;
  dryRun?: boolean;
  error?: string;
}

export interface SendResponse {
  total: number;
  sent: number;
  results: SendResult[];
}

export interface HealthResponse {
  ok: boolean;
}
