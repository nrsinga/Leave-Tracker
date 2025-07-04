/*
  # Fix Missing Database Trigger Function
  
  This script restores the missing handle_new_user trigger function that automatically
  creates employee records when new users are created in Supabase Auth.
  
  INSTRUCTIONS:
  1. Go to your Supabase project dashboard
  2. Navigate to SQL Editor
  3. Create a new query
  4. Copy and paste this entire script
  5. Click "Run" to execute
*/

-- First, drop existing trigger if it exists (cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists (cleanup)
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create employee record when new user signs up
  INSERT INTO public.employees (
    id, 
    employee_code, 
    first_name, 
    last_name, 
    email, 
    role
  )
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

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Verify the function was created
SELECT 'handle_new_user function created successfully!' as status;

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
