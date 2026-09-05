-- Booth Management System — PostgreSQL schema
-- Run via: npm run migrate  (backend/src/migrate.js executes this file)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Wards / constituencies. Every MLA user is scoped to exactly one ward,
-- which is how ward-specific data isolation is enforced at the API layer.
CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MLA / staff accounts. Phone number is the OTP login identifier.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'mla' CHECK (role IN ('mla', 'admin')),
  ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP codes. Codes are stored hashed (bcrypt) — never in plaintext —
-- so a DB read alone can't be used to log in.
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);

-- Booths belong to a ward.
CREATE TABLE IF NOT EXISTS booths (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  ward_id INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  address VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scheme categories + sub-schemes (govt welfare schemes voters are enrolled in)
CREATE TABLE IF NOT EXISTS schemes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Voters. ward_id drives per-MLA data isolation: every voter query from
-- the API is filtered WHERE ward_id = <requesting user's ward_id>.
CREATE TABLE IF NOT EXISTS voters (
  id SERIAL PRIMARY KEY,
  voter_card_id VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  gender VARCHAR(10) NOT NULL DEFAULT 'Male',
  phone VARCHAR(15),
  address VARCHAR(255),
  has_voted BOOLEAN NOT NULL DEFAULT false,
  ward_id INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  booth_id INTEGER REFERENCES booths(id) ON DELETE SET NULL,
  scheme_id INTEGER REFERENCES schemes(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- duplicate detection: same voter card ID cannot repeat within a ward
  UNIQUE (ward_id, voter_card_id)
);
CREATE INDEX IF NOT EXISTS idx_voters_ward ON voters(ward_id);
CREATE INDEX IF NOT EXISTS idx_voters_booth ON voters(booth_id);
CREATE INDEX IF NOT EXISTS idx_voters_name ON voters USING gin (to_tsvector('simple', name));

-- Simple audit trail — useful for showing "real-time sync" / activity feed
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  ward_id INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_voters_updated_at ON voters;
CREATE TRIGGER trg_voters_updated_at
  BEFORE UPDATE ON voters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
