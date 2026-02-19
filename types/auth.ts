export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'gral';
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface DataRecord {
  id: string;
  [key: string]: any;
}

export interface AccessRequest {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}
