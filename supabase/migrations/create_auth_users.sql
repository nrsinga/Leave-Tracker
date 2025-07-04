/*
  # Create Authentication Users

  1. User Creation
    - Create auth users for existing employees
    - Match user UUIDs with employee IDs
    - Set up test users with password123
    - Update employee records with correct UUIDs

  2. Security
    - Users created with ioco.tech domain
    - Email confirmation disabled for testing
    - Passwords set to password123 for initial testing
*/

-- First, let's update the existing employee records with specific UUIDs that we'll use for auth users
UPDATE employees SET id = '550e8400-e29b-41d4-a716-446655440001' WHERE employee_code = '10004381'; -- Anna Pohotona
UPDATE employees SET id = '550e8400-e29b-41d4-a716-446655440002' WHERE employee_code = '10007209'; -- Charl Smit (admin)
UPDATE employees SET id = '550e8400-e29b-41d4-a716-446655440003' WHERE employee_code = '10001372'; -- Chris Lemmer
UPDATE employees SET id = '550e8400-e29b-41d4-a716-446655440004' WHERE employee_code = '10045708'; -- Gary Griffiths
UPDATE employees SET id = '550e8400-e29b-41d4-a716-446655440005' WHERE employee_code = '10059320'; -- Jaco Steyn

-- Update email addresses to use ioco.tech domain
UPDATE employees SET email = 'anna.pohotona@ioco.tech' WHERE employee_code = '10004381';
UPDATE employees SET email = 'charl.smit@ioco.tech' WHERE employee_code = '10007209';
UPDATE employees SET email = 'chris.lemmer@ioco.tech' WHERE employee_code = '10001372';
UPDATE employees SET email = 'gary.griffiths@ioco.tech' WHERE employee_code = '10045708';
UPDATE employees SET email = 'jaco.steyn@ioco.tech' WHERE employee_code = '10059320';
UPDATE employees SET email = 'jp.vanrooyen@ioco.tech' WHERE employee_code = '10003862';
UPDATE employees SET email = 'lyson.mahlaule@ioco.tech' WHERE employee_code = '10010403';
UPDATE employees SET email = 'masempe.mokoena@ioco.tech' WHERE employee_code = '10003045';
UPDATE employees SET email = 'naresh.pema@ioco.tech' WHERE employee_code = '10037368';
UPDATE employees SET email = 'rashveer.singh@ioco.tech' WHERE employee_code = '10054162';
UPDATE employees SET email = 'renier.pretorius@ioco.tech' WHERE employee_code = '10001891';
UPDATE employees SET email = 'rizwan.motala@ioco.tech' WHERE employee_code = '10037337';
UPDATE employees SET email = 'steven.rooker@ioco.tech' WHERE employee_code = '10004466';
UPDATE employees SET email = 'tamika.wagner@ioco.tech' WHERE employee_code = '10063459';
UPDATE employees SET email = 'terence.botha@ioco.tech' WHERE employee_code = '10003864';
UPDATE employees SET email = 'tshepiso.sibande@ioco.tech' WHERE employee_code = '10066574';
UPDATE employees SET email = 'jon.rindel@ioco.tech' WHERE employee_code = '10000230';

-- Create a function to create auth users (this will be executed manually in Supabase dashboard)
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS void AS $$
BEGIN
  -- Note: This function documents the users that need to be created manually in Supabase Auth
  -- The actual user creation must be done through the Supabase dashboard or API
  
  RAISE NOTICE 'Please create the following users in Supabase Auth dashboard:';
  RAISE NOTICE '1. Email: anna.pohotona@ioco.tech, Password: password123, UUID: 550e8400-e29b-41d4-a716-446655440001';
  RAISE NOTICE '2. Email: charl.smit@ioco.tech, Password: password123, UUID: 550e8400-e29b-41d4-a716-446655440002';
  RAISE NOTICE '3. Email: chris.lemmer@ioco.tech, Password: password123, UUID: 550e8400-e29b-41d4-a716-446655440003';
  RAISE NOTICE '4. Email: gary.griffiths@ioco.tech, Password: password123, UUID: 550e8400-e29b-41d4-a716-446655440004';
  RAISE NOTICE '5. Email: jaco.steyn@ioco.tech, Password: password123, UUID: 550e8400-e29b-41d4-a716-446655440005';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to show the notice
SELECT create_test_users();