export type QaSeverity = 'Blocker' | 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type QaCategory =
  | 'Functional'
  | 'UI/UX'
  | 'Responsive'
  | 'Security'
  | 'Data Integrity'
  | 'Print/PDF'
  | 'A11y'
  | 'Performance';
export type QaStatus = 'Open' | 'Fixed' | 'Deferred' | 'Accepted';

export type QaFinding = {
  id: string;
  title: string;
  severity: QaSeverity;
  category: QaCategory;
  status?: QaStatus;
  area: string;
  route?: string;
  evidence: string;
  expected: string;
  actual: string;
  reproduction: string[];
  errorCode?: string;
  recommendation: string;
};

export type QaReport = {
  title: string;
  subtitle: string;
  version: string;
  date: string;
  scope: string[];
  environment: Array<{ label: string; value: string }>;
  summary: Array<{ label: string; value: string }>;
  findings: QaFinding[];
  positives: string[];
  notes: string[];
};

export const QA_REPORT: QaReport = {
  title: 'QA & Pentest Report',
  subtitle: 'Hafta Fisioterapi — Full Application Audit',
  version: '1.0',
  date: '2026-11-16',
  scope: [],
  environment: [],
  summary: [],
  findings: [],
  positives: [],
  notes: [],
};
