export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  logo?: string;
  display_name: string;
  has_active_access: boolean;
  is_trial_user: boolean;
  access_expires_at?: string;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
