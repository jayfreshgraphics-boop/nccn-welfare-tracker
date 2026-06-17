import { createClient } from '@supabase/supabase-js';

// NCCN Welfare Tracker — Supabase connection
// These are embedded directly so the app works the same in any browser
// without needing environment variables set up on every deploy.
const supabaseUrl = 'https://bybjfqksvbodhbmnnswl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5YmpmcWtzdmJvZGhibW5uc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjYzNDksImV4cCI6MjA5NzIwMjM0OX0.q2CYkYZq64Au_K3ZORLxUwRK32lPAam3sbWKTB3v7iM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
