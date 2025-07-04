/*
  # Leave Tracker Database Schema

  1. New Tables
    - `employees` - Employee information with leave balances
      - `id` (uuid, primary key)
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
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  opening_balance decimal(5,2) DEFAULT 0,
  taken decimal(5,2) DEFAULT 0,
  forfeit decimal(5,2) DEFAULT 0,
  pending decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'annual',
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
    auth.uid()::text = id::text OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- RLS Policies for leave_requests table
CREATE POLICY "Users can read own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id::text = auth.uid()::text OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id::text = auth.uid()::text);

CREATE POLICY "Users can update own pending leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    (employee_id::text = auth.uid()::text AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- RLS Policies for leave_history table
CREATE POLICY "Users can read own leave history"
  ON leave_history
  FOR SELECT
  TO authenticated
  USING (
    employee_id::text = auth.uid()::text OR 
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id::text = auth.uid()::text AND role = 'admin'
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

-- Insert sample employee data
INSERT INTO employees (employee_code, first_name, last_name, email, role, opening_balance) VALUES
('10004381', 'Anna', 'Pohotona', 'anna.pohotona@company.com', 'user', 9.33),
('10007209', 'Charl', 'Smit', 'charl.smit@company.com', 'admin', 15.58),
('10001372', 'Chris', 'Lemmer', 'chris.lemmer@company.com', 'user', 9.25),
('10045708', 'Gary', 'Griffiths', 'gary.griffiths@company.com', 'user', 2.67),
('10059320', 'Jaco', 'Steyn', 'jaco.steyn@company.com', 'user', 0),
('10003862', 'Jp', 'Van Rooyen', 'jp.vanrooyen@company.com', 'user', 6.58),
('10010403', 'Lyson', 'Mahlaule', 'lyson.mahlaule@company.com', 'user', 5.58),
('10003045', 'Masempe', 'Mokoena', 'masempe.mokoena@company.com', 'user', 6.50),
('10037368', 'Naresh', 'Pema', 'naresh.pema@company.com', 'user', 8.58),
('10054162', 'Rashveer', 'Singh', 'rashveer.singh@company.com', 'user', 8.75),
('10001891', 'Renier', 'Pretorius', 'renier.pretorius@company.com', 'user', 8.58),
('10037337', 'Rizwan', 'Motala', 'rizwan.motala@company.com', 'user', 10.83),
('10004466', 'Steven', 'Rooker', 'steven.rooker@company.com', 'user', 13.08),
('10063459', 'Tamika', 'Wagner', 'tamika.wagner@company.com', 'user', 6.75),
('10003864', 'Terence', 'Botha', 'terence.botha@company.com', 'user', 9.67),
('10066574', 'Tshepiso', 'Sibande', 'tshepiso.sibande@company.com', 'user', 10),
('10000230', 'Jon', 'Rindel', 'jon.rindel@company.com', 'user', 10.08)
ON CONFLICT (employee_code) DO NOTHING;