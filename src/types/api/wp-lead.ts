export interface WPLeadRequestBody {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service_interest?: string;
  budget?: string;
  message: string;
  source?: string;
}

export interface WPLeadResponse {
  id: number;
  status: "success" | "error";
  message?: string;
}
