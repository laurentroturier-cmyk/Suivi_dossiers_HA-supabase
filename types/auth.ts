export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
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
