// Fixed script to create users via Supabase Admin API
// Run with: node src/utils/createUsers.js

const SUPABASE_URL = 'https://wheyzyqoigxvvkdfdxej.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZXl6eXFvaWd4dnZrZGZkeGVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NTQ3MywiZXhwIjoyMDY3MjIxNDczfQ.8xvogkrxOm6Ncjr7h4PlMt0w_QrcLFyIvlQrHtv_yA0'

const users = [
  {
    email: 'nrsinga@gmail.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      first_name: 'Naresh',
      last_name: 'Singa',
      role: 'admin'
    }
  },
  {
    email: 'naresh.pema@ioco.tech',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      first_name: 'Naresh',
      last_name: 'Pema',
      role: 'user'
    }
  }
]

async function createUsers() {
  console.log('🚀 Starting user creation process...')
  
  for (const user of users) {
    try {
      console.log(`📝 Creating user: ${user.email}...`)
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify(user)
      })
      
      const responseText = await response.text()
      
      if (response.ok) {
        const result = JSON.parse(responseText)
        console.log(`✅ Created user: ${user.email}`)
        console.log(`   - User ID: ${result.user?.id}`)
        console.log(`   - Role: ${user.user_metadata.role}`)
        console.log(`   - Email confirmed: ${result.user?.email_confirmed_at ? 'Yes' : 'No'}`)
        
        // Wait a moment for triggers to process
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } else {
        console.error(`❌ Failed to create user ${user.email}:`)
        console.error(`   Status: ${response.status} ${response.statusText}`)
        console.error(`   Response: ${responseText}`)
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.msg) {
            console.error(`   Error: ${errorData.msg}`)
          }
          if (errorData.error_description) {
            console.error(`   Description: ${errorData.error_description}`)
          }
        } catch (e) {
          // Response wasn't JSON, already logged above
        }
      }
    } catch (error) {
      console.error(`❌ Network error creating user ${user.email}:`, error.message)
    }
    
    console.log('') // Empty line for readability
  }
  
  console.log('🎉 User creation process completed!')
  console.log('')
  console.log('📋 Test Login Credentials:')
  console.log('👑 Admin User:')
  console.log('   Email: nrsinga@gmail.com')
  console.log('   Password: password123')
  console.log('')
  console.log('👤 Regular User:')
  console.log('   Email: naresh.pema@ioco.tech')
  console.log('   Password: password123')
  console.log('')
  console.log('🔍 Next steps:')
  console.log('1. Check Supabase Auth dashboard to verify users were created')
  console.log('2. Check employees table to verify triggers created profiles')
  console.log('3. Try logging in with the credentials above')
}

// Check if we're running in Node.js
if (typeof window === 'undefined') {
  // Node.js environment
  createUsers().catch(console.error)
} else {
  // Browser environment
  console.log('This script should be run in Node.js with: node src/utils/createUsers.js')
}
