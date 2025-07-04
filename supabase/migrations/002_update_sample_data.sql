/*
  # Update Sample Data for Specific Test Users

  1. Changes
    - Remove old sample employee data
    - Add new sample data for nrsinga@gmail.com (admin) and naresh.pema@ioco.tech (user)
    - Update leave requests to reference new users
    - Update leave history to reference new users

  2. Test Users
    - Naresh Singa (nrsinga@gmail.com) - Admin role
    - Naresh Pema (naresh.pema@ioco.tech) - User role
*/

-- Clear existing sample data
DELETE FROM leave_history WHERE employee_id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
);

DELETE FROM leave_requests WHERE employee_id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
);

DELETE FROM employees WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
);

-- Insert new test users (these will be created when users register via the createUsers script)
DO $$
DECLARE
  admin_id uuid := '550e8400-e29b-41d4-a716-446655440001';
  user_id uuid := '550e8400-e29b-41d4-a716-446655440002';
BEGIN
  -- Insert sample employees for testing
  INSERT INTO employees (id, employee_code, first_name, last_name, email, role, opening_balance, taken, pending) VALUES
  (admin_id, 'EMP001', 'Naresh', 'Singa', 'nrsinga@gmail.com', 'admin', 25.00, 3.00, 2.00),
  (user_id, 'EMP002', 'Naresh', 'Pema', 'naresh.pema@ioco.tech', 'user', 22.00, 5.00, 3.00)
  ON CONFLICT (id) DO UPDATE SET
    employee_code = EXCLUDED.employee_code,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    opening_balance = EXCLUDED.opening_balance,
    taken = EXCLUDED.taken,
    pending = EXCLUDED.pending;

  -- Insert sample leave requests
  INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, days_requested, reason, status, created_at) VALUES
  ('req-001', user_id, 'Annual Leave', '2024-02-15', '2024-02-19', 5.00, 'Family vacation', 'pending', now() - interval '2 days'),
  ('req-002', user_id, 'Sick Leave', '2024-02-20', '2024-02-21', 2.00, 'Medical appointment', 'approved', now() - interval '1 day'),
  ('req-003', user_id, 'Personal Leave', '2024-02-22', '2024-02-22', 1.00, 'Personal appointment', 'pending', now() - interval '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample leave history
  INSERT INTO leave_history (employee_id, leave_request_id, action, new_values, performed_by, created_at) VALUES
  (user_id, 'req-001', 'leave_requested', '{"days": 5, "start_date": "2024-02-15", "end_date": "2024-02-19"}', user_id, now() - interval '2 days'),
  (user_id, 'req-002', 'leave_requested', '{"days": 2, "start_date": "2024-02-20", "end_date": "2024-02-21"}', user_id, now() - interval '1 day'),
  (user_id, 'req-002', 'leave_approved', '{"status": "approved", "days": 2}', admin_id, now() - interval '12 hours'),
  (user_id, 'req-003', 'leave_requested', '{"days": 1, "start_date": "2024-02-22", "end_date": "2024-02-22"}', user_id, now() - interval '3 days')
  ON CONFLICT DO NOTHING;
END $$;
