// Debug script to identify user creation issues
// Run with: node src/utils/debugUserCreation.js

const SUPABASE_URL = 'https://wheyzyqoigxvvkdfdxej.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZXl6eXFvaWd4dnZrZGZkeGVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NTQ3MywiZXhwIjoyMDY3MjIxNDczfQ.8xvogkrxOm6Ncjr7h4PlMt0w_QrcLFyIvlQrHtv_yA0'

async function debugUserCreation() {
  console.log('🔍 Debugging user creation issues...')
  console.log('')

  // Step 1: Check if trigger function exists
  console.log('1️⃣ Checking trigger function...')
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/handle_new_user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({})
    })
    
    if (response.status === 404) {
      console.log('❌ handle_new_user function not found in schema')
    } else {
      console.log('✅ handle_new_user function exists')
    }
  } catch (error) {
    console.log('❌ Error checking function:', error.message)
  }

  // Step 2: Check trigger on auth.users table
  console.log('')
  console.log('2️⃣ Checking database triggers...')
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_triggers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({})
    })
    
    console.log('Trigger check response:', response.status)
  } catch (error) {
    console.log('❌ Error checking triggers:', error.message)
  }

  // Step 3: Test employee table insertion directly
  console.log('')
  console.log('3️⃣ Testing direct employee insertion...')
  try {
    const testEmployee = {
      id: '550e8400-e29b-41d4-a716-446655440099',
      employee_code: 'TEST001',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      role: 'user'
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testEmployee)
    })

    if (response.ok) {
      console.log('✅ Direct employee insertion works')
      
      // Clean up test record
      await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${testEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      })
    } else {
      const errorText = await response.text()
      console.log('❌ Direct employee insertion failed:', errorText)
    }
  } catch (error) {
    console.log('❌ Error testing employee insertion:', error.message)
  }

  // Step 4: Check existing users in auth
  console.log('')
  console.log('4️⃣ Checking existing users...')
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Found ${data.users?.length || 0} existing users`)
      
      if (data.users?.length > 0) {
        console.log('   Existing users:')
        data.users.forEach(user => {
          console.log(`   - ${user.email} (${user.id})`)
        })
      }
    }
  } catch (error) {
    console.log('❌ Error checking users:', error.message)
  }

  // Step 5: Try creating user without email confirmation
  console.log('')
  console.log('5️⃣ Testing simplified user creation...')
  try {
    const testUser = {
      email: 'debug-test@example.com',
      password: 'password123',
      email_confirm: true
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify(testUser)
    })

    const responseText = await response.text()
    
    if (response.ok) {
      console.log('✅ Simplified user creation works')
      const result = JSON.parse(responseText)
      
      // Clean up test user
      if (result.user?.id) {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${result.user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        })
      }
    } else {
      console.log('❌ Simplified user creation failed:')
      console.log(`   Status: ${response.status}`)
      console.log(`   Response: ${responseText}`)
    }
  } catch (error) {
    console.log('❌ Error testing simplified creation:', error.message)
  }

  console.log('')
  console.log('🔍 Debug completed!')
}

// Check if we're running in Node.js
if (typeof window === 'undefined') {
  debugUserCreation().catch(console.error)
} else {
  console.log('This script should be run in Node.js with: node src/utils/debugUserCreation.js')
}
