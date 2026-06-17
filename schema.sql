-- ============================================================
-- NCCN WELFARE TRACKER — SUPABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

CREATE TABLE officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'GREEN' CHECK (status IN ('GREEN','AMBER','RED')),
  assigned_to TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  last_checked DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES auth.users(id),
  checked_by_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('GREEN','AMBER','RED')),
  notes TEXT DEFAULT '',
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Welfare Officer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read officers"   ON officers FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Auth users can insert officers" ON officers FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Auth users can update officers" ON officers FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY "Auth users can delete officers" ON officers FOR DELETE USING (auth.role()='authenticated');

CREATE POLICY "Auth users can read checkins"   ON checkins FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Auth users can insert checkins" ON checkins FOR INSERT WITH CHECK (auth.role()='authenticated');

CREATE POLICY "Users can read all profiles"   ON profiles FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "Users can insert own profile"  ON profiles FOR INSERT WITH CHECK (auth.uid()=id);
CREATE POLICY "Users can update own profile"  ON profiles FOR UPDATE USING (auth.uid()=id);

-- ============================================================
-- MIGRATION: If you already ran the schema above, run this
-- single line to add the assigned_to column:
-- ALTER TABLE officers ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';
-- ============================================================
