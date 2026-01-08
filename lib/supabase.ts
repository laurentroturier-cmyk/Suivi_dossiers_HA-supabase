
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kktxzgumcpumxaldxsim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdHh6Z3VtY3B1bXhhbGR4c2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTgzNzMsImV4cCI6MjA4MTMzNDM3M30.EZ2YtKcCVAf5G3JRE3k03_lM0GuzUVyKQyTbstg5y2s';

// Client initialisé avec les identifiants de production
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const initSupabase = (url: string, key: string) => {
  return createClient(url, key);
};
