export interface Lead {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  serviceInterest: string | null;
  budget: string | null;
  message: string;
  source: string | null;
  submittedAt: string;
}

export interface LeadSubmissionResult {
  success: boolean;
  message: string;
}
