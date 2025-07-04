/*
  # Add Calculate Working Days Function

  This migration adds the missing calculate_working_days function that calculates
  business days between two dates, excluding weekends.

  1. Function Details
    - `calculate_working_days(start_date, end_date)` - Returns number of working days
    - Excludes weekends (Saturday and Sunday)
    - Includes both start and end dates if they are weekdays
    - Returns decimal to support half-day calculations

  2. Usage
    - Used by the frontend to calculate leave days
    - Accessible via PostgREST API
    - Returns 0 if end_date is before start_date
*/

-- Function to calculate working days between two dates (excluding weekends)
CREATE OR REPLACE FUNCTION calculate_working_days(
  start_date date,
  end_date date
)
RETURNS decimal AS $$
DECLARE
  working_days decimal := 0;
  current_date date;
BEGIN
  -- Return 0 if end date is before start date
  IF end_date < start_date THEN
    RETURN 0;
  END IF;
  
  -- Loop through each date and count working days
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    -- Check if current date is not a weekend (1=Sunday, 7=Saturday in PostgreSQL)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      working_days := working_days + 1;
    END IF;
    
    current_date := current_date + 1;
  END LOOP;
  
  RETURN working_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_working_days(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_working_days(date, date) TO anon;

-- Test the function with a few examples
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
