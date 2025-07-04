# Database Setup Instructions - UPDATED

## Step 1: Execute the Fixed SQL Script

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Create a new query**
4. **Copy the entire contents** of the updated `database-setup.sql`
5. **Paste it into the SQL Editor**
6. **Click "Run"** to execute the script

✅ **This version removes the problematic sample data that was causing foreign key errors.**

## Step 2: Test User Registration

After running the SQL script:

1. **Start the application** (already running)
2. **Register a new user** with:
   - Email: `anna.pohotona@ioco.tech` 
   - Password: `password123`
   - First Name: `Anna`
   - Last Name: `Pohotona`
   - Role: `admin` (in metadata)

3. **Register additional test users**:
   - `charl.smit@ioco.tech` (role: user)
   - `sarah.johnson@ioco.tech` (role: user)

## What the Fixed Database Setup Creates

✅ **Tables**:
- `employees` - Employee profiles with leave balances
- `leave_requests` - Leave request management  
- `leave_history` - Audit logging

✅ **Security**:
- Row Level Security (RLS) enabled
- Role-based access policies
- Secure authentication integration

✅ **Automation**:
- Auto-balance updates on approval/rejection
- **Automatic employee profile creation on signup** 🎯
- Complete audit trail logging

✅ **Clean Start**:
- No sample data causing foreign key issues
- Ready for real user registration
- Proper auth.users integration

## How It Works Now

1. **User registers** → Supabase creates auth.users record
2. **Trigger fires** → Automatically creates employees record
3. **User can login** → Full leave management system available
4. **Admin users** → Can approve/reject leave requests
5. **All changes** → Automatically logged in leave_history

## Next Steps

1. ✅ Run the fixed SQL script
2. ✅ Register your first admin user
3. ✅ Test the complete leave management workflow
4. ✅ Register additional users as needed

The foreign key constraint issue is now resolved! 🎉
