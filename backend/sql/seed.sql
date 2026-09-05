-- Sample seed data — safe to run once after schema.sql
-- Replace phone numbers with real MLA numbers before going live.

INSERT INTO wards (name) VALUES
  ('Amritsar North'),
  ('Jalandhar Central')
ON CONFLICT (name) DO NOTHING;

-- Two MLA accounts + one admin (admin sees all wards)
INSERT INTO users (name, phone, role, ward_id)
SELECT 'MLA - Amritsar North', '+919999900001', 'mla', id FROM wards WHERE name = 'Amritsar North'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO users (name, phone, role, ward_id)
SELECT 'MLA - Jalandhar Central', '+919999900002', 'mla', id FROM wards WHERE name = 'Jalandhar Central'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO users (name, phone, role, ward_id)
VALUES ('Constituency Office Admin', '+919999900000', 'admin', NULL)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO booths (name, ward_id, address)
SELECT 'Booth 1 - Govt School', id, 'Main Road' FROM wards WHERE name = 'Amritsar North'
ON CONFLICT DO NOTHING;

INSERT INTO booths (name, ward_id, address)
SELECT 'Booth 2 - Community Hall', id, 'Sector 5' FROM wards WHERE name = 'Amritsar North'
ON CONFLICT DO NOTHING;

INSERT INTO schemes (name, category, ward_id)
SELECT 'Old Age Pension', 'Welfare', id FROM wards WHERE name = 'Amritsar North'
ON CONFLICT DO NOTHING;

INSERT INTO schemes (name, category, ward_id)
SELECT 'Girl Child Scholarship', 'Education', id FROM wards WHERE name = 'Amritsar North'
ON CONFLICT DO NOTHING;
