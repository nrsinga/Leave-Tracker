/*
  # Fix Existing Authentication Users

  1. Clean Setup
    - Drop and recreate employees table
    - Map existing auth users to employee records
    - Set up proper RLS policies
    
  2. Existing Users
    - Work with existing anna.pohotona@ioco.tech and charl.smit@ioco.tech
    - Map them to employee records with correct roles
    
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

-- Function to map existing auth users to employee records
CREATE OR REPLACE FUNCTION map_existing_auth_users()
RETURNS void AS $$
DECLARE
  anna_id uuid;
  charl_id uuid;
BEGIN
  -- Get existing user IDs from auth.users
  SELECT id INTO anna_id FROM auth.users WHERE email = 'anna.pohotona@ioco.tech';
  SELECT id INTO charl_id FROM auth.users WHERE email = 'charl.smit@ioco.tech';
  
  -- Create employee records for existing users
  IF anna_id IS NOT NULL THEN
    INSERT INTO employees (
      id,
      employee_code,
      first_name,
      last_name,
      email,
      role,
      opening_balance
    ) VALUES (
      anna_id,
      'EMP001',
      'Anna',
      'Pohotona',
      'anna.pohotona@ioco.tech',
      'admin',
      21
    ) ON CONFLICT (id) DO UPDATE SET
      employee_code = EXCLUDED.employee_code,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      opening_balance = EXCLUDED.opening_balance;
  END IF;
  
  IF charl_id IS NOT NULL THEN
    INSERT INTO employees (
      id,
      employee_code,
      first_name,
      last_name,
      email,
      role,
      opening_balance
    ) VALUES (
      charl_id,
      'EMP002',
      'Charl',
      'Smit',
      'charl.smit@ioco.tech',
      'user',
      15
    ) ON CONFLICT (id) DO UPDATE SET
      employee_code = EXCLUDED.employee_code,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      opening_balance = EXCLUDED.opening_balance;
  END IF;
  
  RAISE NOTICE 'Mapped existing auth users to employee records';
  RAISE NOTICE 'Anna ID: %, Charl ID: %', anna_id, charl_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the mapping function
SELECT map_existing_auth_users();

-- Show current auth users for verification
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE 'Current auth users:';
  FOR user_record IN 
    SELECT id, email, created_at 
    FROM auth.users 
    WHERE email IN ('anna.pohotona@ioco.tech', 'charl.smit@ioco.tech')
  LOOP
    RAISE NOTICE 'User: % (ID: %)', user_record.email, user_record.id;
  END LOOP;
END $$;