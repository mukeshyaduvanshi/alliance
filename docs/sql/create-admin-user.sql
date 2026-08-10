-- ============================================================
-- QUERY 2: Create ADMIN user + role  (run in Supabase SQL editor)
-- ============================================================
-- Login:  itadmin@colorjet.com  /  Admin@123
-- This creates: Admin role -> all permissions -> user
-- Safe to run: uses ON CONFLICT, re-running won't duplicate.
-- is_super_admin = true  => full access to all portals (like current admin).
-- Set is_super_admin = false to enforce strict role-based access.

-- 1) Role
INSERT INTO roles (id, tenant_id, name, department, status, is_system_role, created_at, updated_at)
VALUES (gen_random_uuid(), '2c8ea43a-132f-49de-8adf-df43e5097ed2', 'Admin', 'Administration', 'ACTIVE', true, now(), now())
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 2) Assign every permission to the Admin role
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, now()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND r.tenant_id = '2c8ea43a-132f-49de-8adf-df43e5097ed2'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3) User (password hash = bcrypt of "Admin@123")
INSERT INTO users (id, tenant_id, role_id, full_name, email, phone, password_hash, status, is_super_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '2c8ea43a-132f-49de-8adf-df43e5097ed2',
  (SELECT id FROM roles WHERE name = 'Admin' AND tenant_id = '2c8ea43a-132f-49de-8adf-df43e5097ed2'),
  'IT Admin',
  'itadmin@colorjet.com',
  NULL,
  '$2b$10$sDaRrleUdQac/8PoSmmxmOOg2tEIcI/nTfZraGrWlElUo2nI6.Ef.',
  'ACTIVE',
  true,
  now(),
  now()
)
ON CONFLICT (tenant_id, email) DO NOTHING;
