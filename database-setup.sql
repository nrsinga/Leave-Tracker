/*
  # Complete Leave Tracker System - Manual Setup

  INSTRUCTIONS:
  1. Go to your Supabase project dashboard
  2. Navigate to SQL Editor
  3. Create a new query
  4. Copy and paste this entire script
  5. Click "Run" to execute

  This script creates:
  - All necessary tables with proper relationships
  - Row Level Security policies
  - Automated functions and triggers
  - Ready for user registration
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

-- Success message
SELECT 'Database setup completed successfully! Register users to start using the leave tracker.' as message;
