/*
  # Reset Authentication System

  1. Clean Setup
    - Drop and recreate employees table with proper structure
    - Create auth users with correct UUIDs
    - Set up proper RLS policies
    
  2. Test Users
    - Anna Pohotona (admin)
    - Charl Smit (user)
    - Both with password "password123"
    
  3. Security
    - Enable RLS on employees table
    - Add policies for authenticated users
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS employees CASCADE;

-- Create employees table with proper structure
CREATE TABLE employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  opening_balance integer NOT NULL DEFAULT 21,
  taken integer NOT NULL DEFAULT 0,
  forfeit integer NOT NULL DEFAULT 0,
  pending integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to create auth user and employee record
CREATE OR REPLACE FUNCTION create_employee_with_auth(
  p_email text,
  p_password text,
  p_employee_code text,
  p_first_name text,
  p_last_name text,
  p_role text DEFAULT 'user'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create employee record
  INSERT INTO employees (
    id,
    employee_code,
    first_name,
    last_name,
    email,
    role
  ) VALUES (
    new_user_id,
    p_employee_code,
    p_first_name,
    p_last_name,
    p_email,
    p_role
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create test users
SELECT create_employee_with_auth(
  'anna.pohotona@ioco.tech',
  'password123',
  'EMP001',
  'Anna',
  'Pohotona',
  'admin'
);

SELECT create_employee_with_auth(
  'charl.smit@ioco.tech',
  'password123',
  'EMP002',
  'Charl',
  'Smit',
  'user'
);