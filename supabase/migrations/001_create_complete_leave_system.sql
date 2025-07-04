/*
  # Complete Leave Tracker System

  1. New Tables
    - `employees` - Employee information with leave balances
      - `id` (uuid, primary key, references auth.users)
      - `employee_code` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `role` (text, default 'user')
      - `opening_balance` (decimal)
      - `taken` (decimal, default 0)
      - `forfeit` (decimal, default 0)
      - `pending` (decimal, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `leave_requests` - Leave request management
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `leave_type` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `days_requested` (decimal)
      - `reason` (text)
      - `status` (text, default 'pending')
      - `approved_by` (uuid, nullable)
      - `approved_at` (timestamp, nullable)
      - `comments` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `leave_history` - Audit log for leave changes
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `leave_request_id` (uuid, foreign key, nullable)
      - `action` (text)
      - `old_values` (jsonb, nullable)
      - `new_values` (jsonb, nullable)
      - `performed_by` (uuid)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Users can only see their own data
    - Admins can see and modify all data

  3. Functions
    - Trigger to update leave balances automatically
    - Function to calculate available leave days
    - Function to handle user registration
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  opening_balance decimal(5,2) DEFAULT 21.00,
  taken decimal(5,2) DEFAULT 0.00,
  forfeit decimal(5,2) DEFAULT 0.00,
  pending decimal(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'Annual Leave',
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested decimal(5,2) NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES employees(id),
  approved_at timestamptz,
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leave_history table for audit logging
CREATE TABLE IF NOT EXISTS leave_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_request_id uuid REFERENCES leave_requests(id) ON DELETE SET NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees table
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for leave_requests table
CREATE POLICY "Users can read own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own pending leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    (employee_id = auth.uid() AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for leave_history table
CREATE POLICY "Users can read own leave history"
  ON leave_history
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert leave history"
  ON leave_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update employee leave balances
CREATE OR REPLACE FUNCTION update_employee_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- Update pending balance when leave request status changes
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from pending to approved
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      UPDATE employees 
      SET 
        pending = pending - NEW.days_requested,
        taken = taken + NEW.days_requested,
        updated_at = now()
      WHERE id = NEW.employee_id;
      
      -- Log the change
      INSERT INTO leave_history (employee_id, leave_request_id, action, old_values, new_values, performed_by)
      VALUES (
        NEW.employee_id,
        NEW.id,
        'leave_approved',
        jsonb_build_object('status', OLD.status, 'days', NEW.days_requested),
        jsonb_build_object('status', NEW.status, 'days', NEW.days_requested),
        auth.uid()
      );
      
    -- If status changed from pending to rejected
    ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      UPDATE employees 
      SET 
        pending = pending - NEW.days_requested,
        updated_at = now()
      WHERE id = NEW.employee_id;
      
      -- Log the change
      INSERT INTO leave_history (employee_id, leave_request_id, action, old_values, new_values, performed_by)
      VALUES (
        NEW.employee_id,
        NEW.id,
        'leave_rejected',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        auth.uid()
      );
    END IF;
    
  -- When new leave request is created
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE employees 
    SET 
      pending = pending + NEW.days_requested,
      updated_at = now()
    WHERE id = NEW.employee_id;
    
    -- Log the change
    INSERT INTO leave_history (employee_id, leave_request_id, action, new_values, performed_by)
    VALUES (
      NEW.employee_id,
      NEW.id,
      'leave_requested',
      jsonb_build_object('days', NEW.days_requested, 'start_date', NEW.start_date, 'end_date', NEW.end_date),
      NEW.employee_id
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS update_balances_trigger ON leave_requests;
CREATE TRIGGER update_balances_trigger
  AFTER INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_balances();

-- Function to calculate available leave days
CREATE OR REPLACE FUNCTION get_available_days(employee_uuid uuid)
RETURNS decimal AS $$
DECLARE
  emp_record employees%ROWTYPE;
  available_days decimal;
BEGIN
  SELECT * INTO emp_record FROM employees WHERE id = employee_uuid;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  available_days := emp_record.opening_balance - emp_record.taken - emp_record.forfeit - emp_record.pending;
  
  RETURN GREATEST(available_days, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create employee record when new user signs up
  INSERT INTO employees (id, employee_code, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    'EMP' || LPAD(EXTRACT(epoch FROM now())::text, 6, '0'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert sample employee data with specific UUIDs for testing
DO $$
DECLARE
  anna_id uuid := '550e8400-e29b-41d4-a716-446655440001';
  charl_id uuid := '550e8400-e29b-41d4-a716-446655440002';
  sarah_id uuid := '550e8400-e29b-41d4-a716-446655440003';
BEGIN
  -- Insert sample employees (these will be created when users register)
  INSERT INTO employees (id, employee_code, first_name, last_name, email, role, opening_balance, taken, pending) VALUES
  (anna_id, 'EMP001', 'Anna', 'Pohotona', 'anna.pohotona@ioco.tech', 'admin', 25.00, 5.00, 3.00),
  (charl_id, 'EMP002', 'Charl', 'Smit', 'charl.smit@ioco.tech', 'user', 22.00, 8.00, 2.00),
  (sarah_id, 'EMP003', 'Sarah', 'Johnson', 'sarah.johnson@ioco.tech', 'user', 20.00, 3.00, 5.00)
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
  ('req-001', charl_id, 'Annual Leave', '2024-02-15', '2024-02-19', 5.00, 'Family vacation to Cape Town', 'pending', now() - interval '2 days'),
  ('req-002', sarah_id, 'Sick Leave', '2024-02-20', '2024-02-21', 2.00, 'Medical procedure', 'pending', now() - interval '1 day'),
  ('req-003', charl_id, 'Personal Leave', '2024-02-22', '2024-02-22', 1.00, 'Personal appointment', 'approved', now() - interval '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample leave history
  INSERT INTO leave_history (employee_id, leave_request_id, action, new_values, performed_by, created_at) VALUES
  (charl_id, 'req-001', 'leave_requested', '{"days": 5, "start_date": "2024-02-15", "end_date": "2024-02-19"}', charl_id, now() - interval '2 days'),
  (sarah_id, 'req-002', 'leave_requested', '{"days": 2, "start_date": "2024-02-20", "end_date": "2024-02-21"}', sarah_id, now() - interval '1 day'),
  (charl_id, 'req-003', 'leave_requested', '{"days": 1, "start_date": "2024-02-22", "end_date": "2024-02-22"}', charl_id, now() - interval '3 days'),
  (charl_id, 'req-003', 'leave_approved', '{"status": "approved", "days": 1}', anna_id, now() - interval '2 days')
  ON CONFLICT DO NOTHING;
END $$;