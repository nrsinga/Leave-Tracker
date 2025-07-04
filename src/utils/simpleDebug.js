// Simple debug script to identify user creation issues
console.log('🔍 Starting debug process...')

const SUPABASE_URL = 'https://wheyzyqoigxvvkdfdxej.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZXl6eXFvaWd4dnZrZGZkeGVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NTQ3MywiZXhwIjoyMDY3MjIxNDczfQ.8xvogkrxOm6Ncjr7h4PlMt0w_QrcLFyIvlQrHtv_yA0'

async function main() {
  console.log('✅ Script started successfully')
  
  // Test 1: Basic connectivity
  console.log('\n1️⃣ Testing basic connectivity...')
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    })
    console.log(`✅ Basic connectivity: ${response.status}`)
  } catch (error) {
    console.log(`❌ Connectivity failed: ${error.message}`)
    return
  }

  // Test 2: Check employees table structure
  console.log('\n2️⃣ Checking employees table...')
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    })
    console.log(`✅ Employees table accessible: ${response.status}`)
  } catch (error) {
    console.log(`❌ Employees table error: ${error.message}`)
  }

  // Test 3: Try simple user creation without metadata
  console.log('\n3️⃣ Testing simple user creation...')
  try {
    const simpleUser = {
      email: 'simple-test@example.com',
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
      body: JSON.stringify(simpleUser)
    })

    const responseText = await response.text()
    console.log(`Response status: ${response.status}`)
    console.log(`Response: ${responseText}`)

    if (response.ok) {
      console.log('✅ Simple user creation works!')
      const result = JSON.parse(responseText)
      
      // Clean up
      if (result.user?.id) {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${result.user.id}`, {
          method: 'DELETE',