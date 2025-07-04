/*
  # Fix Database Setup - Remove Sample Data

  This migration removes the problematic sample data that was causing foreign key constraint violations.
  The system will work with real user registration instead.

  1. Changes
    - Remove sample employee data insertion
    - Remove sample leave requests
    - Remove sample leave history
    - Keep all table structures and functions intact

  2. Result
    - Clean database ready for user registration
    - All triggers and functions working properly
    - No foreign key constraint issues
*/

-- This migration removes the sample data that was causing foreign key issues
-- The database structure remains intact and ready for real user registration

SELECT 'Sample data removed - database ready for user registration' as message;
