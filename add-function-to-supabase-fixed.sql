/*
  # Add Missing calculate_working_days Function - FIXED VERSION
  
  INSTRUCTIONS:
  1. Go to your Supabase project dashboard
  2. Navigate to SQL Editor
  3. Create a new query
  4. Copy and paste this script
  5. Click "Run" to execute
  
  This adds the missing function with corrected PostgreSQL syntax.
*/

-- Function to calculate working days between two dates (excluding weekends)
CREATE OR REPLACE FUNCTION calculate_working_days(
  start_date date,
  end_date date
)
RETURNS decimal AS $$
DECLARE
  working_days decimal := 0;
  loop_date date;
BEGIN
  -- Return 0 if end date is before start date
  IF end_date < start_date THEN
    RETURN 0;
  END IF;
  
  -- Loop through each date and count working days
  loop_date := start_date;
  
  WHILE loop_date <= end_date LOOP
    -- Check if current date is not a weekend (0=Sunday, 6=Saturday in PostgreSQL)
    IF EXTRACT(DOW FROM loop_date) NOT IN (0, 6) THEN
      working_days := working_days + 1;
    END IF;
    
    loop_date := loop_date + 1;
  END LOOP;
  
  RETURN working_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users and anonymous users
GRANT EXECUTE ON FUNCTION calculate_working_days(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_working_days(date, date) TO anon;

-- Test the function with a few examples to verify it works
DO $$
BEGIN
  -- Test: Monday to Friday (5 working days)
  ASSERT calculate_working_days('2024-02-05'::date, '2024-02-09'::date) = 5, 'Monday to Friday should be 5 days';
  
  -- Test: Friday to Monday (2 working days - Friday and Monday)
  ASSERT calculate_working_days('2024-02-09'::date, '2024-02-12'::date) = 2, 'Friday to Monday should be 2 days';
  
  -- Test: Same day (1 working day if weekday)
  ASSERT calculate_working_days('2024-02-05'::date, '2024-02-05'::date) = 1, 'Same weekday should be 1 day';
  
  -- Test: Weekend only (0 working days)
  ASSERT calculate_working_days('2024-02-10'::date, '2024-02-11'::date) = 0, 'Weekend only should be 0 days';
  
  RAISE NOTICE 'All calculate_working_days tests passed!';
END $$;

-- Success confirmation
SELECT 'calculate_working_days function added successfully!' as message;
