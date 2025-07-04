/*
  # Fix Duplicate Employee Code Generation

  The handle_new_user trigger is generating duplicate employee codes.
  This updates the function to generate truly unique codes using a sequence.
*/

-- Create a sequence for employee codes if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS employee_code_seq START 1000;

-- Update the handle_new_user function to use the sequence
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_employee_code text;
BEGIN
  -- Generate unique employee code using sequence
  new_employee_code := 'EMP' || LPAD(nextval('employee_code_seq')::text, 4, '0');
  
  -- Create employee record when new user signs up
  INSERT INTO employees (id, employee_code, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    new_employee_code,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up any duplicate employee codes that might exist
DELETE FROM employees WHERE employee_code = 'EMP175165' AND id NOT IN (
  SELECT id FROM auth.users WHERE email = 'nrsinga@gmail.com'
);
