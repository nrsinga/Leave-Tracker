// Comprehensive API verification script for Supabase endpoints
// Run with: node src/utils/verifyAPIs.js

const SUPABASE_URL = 'https://wheyzyqoigxvvkdfdxej.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZXl6eXFvaWd4dnZrZGZkeGVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NTQ3MywiZXhwIjoyMDY3MjIxNDczfQ.8xvogkrxOm6Ncjr7h4PlMt0w_QrcLFyIvlQrHtv_yA0'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZXl6eXFvaWd4dnZrZGZkeGVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NTQ3MywiZXhwIjoyMDY3MjIxNDczfQ.8xvogkrxOm6Ncjr7h4PlMt0w_QrcLFyIvlQrHtv_yA0'

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

// Helper function to log test results
function logTest(name, success, details = '') {
  const status = success ? '✅' : '❌'
  const message = `${status} ${name}`
  
  console.log(message)
  if (details) {
    console.log(`   ${details}`)
  }
  
  results.tests.push({ name, success, details })
  if (success) {
    results.passed++
  } else {
    results.failed++
  }
}

// Test 1: Basic connectivity
async function testConnectivity() {
  console.log('\n🔗 Testing Basic Connectivity...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    })
    
    if (response.ok) {
      logTest('Supabase URL reachable', true, `Status: ${response.status}`)
    } else {
      logTest('Supabase URL reachable', false, `Status: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    logTest('Supabase URL reachable', false, `Network error: ${error.message}`)
  }
}

// Test 2: Authentication API
async function testAuthAPI() {
  console.log('\n🔐 Testing Authentication API...')
  
  try {
    // Test auth endpoint availability
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    })
    
    if (response.ok) {
      const settings = await response.json()
      logTest('Auth API accessible', true, `External providers: ${settings.external?.length || 0}`)
    } else {
      logTest('Auth API accessible', false, `Status: ${response.status}`)
    }
  } catch (error) {
    logTest('Auth API accessible', false, `Error: ${error.message}`)
  }
}

// Test 3: Admin Auth API (for user creation)
async function testAdminAuthAPI() {
  console.log('\n👑 Testing Admin Auth API...')
  
  try {
    // Test admin users endpoint (should require service role)
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      logTest('Admin Auth API accessible', true, `Can list users (found ${data.users?.length || 0})`)
    } else {
      const errorText = await response.text()
      logTest('Admin Auth API accessible', false, `Status: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    logTest('Admin Auth API accessible', false, `Error: ${error.message}`)
  }
}

// Test 4: Database API (REST)
async function testDatabaseAPI() {
  console.log('\n🗄️ Testing Database API...')
  
  // Test employees table
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      logTest('Employees table accessible', true, `Table exists and queryable`)
    } else {
      const errorText = await response.text()
      logTest('Employees table accessible', false, `Status: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    logTest('Employees table accessible', false, `Error: ${error.message}`)
  }
  
  // Test leave_requests table
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.ok) {
      logTest('Leave requests table accessible', true, `Table exists and queryable`)
    } else {
      const errorText = await response.text()
      logTest('Leave requests table accessible', false, `Status: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    logTest('Leave requests table accessible', false, `Error: ${error.message}`)
  }
  
  // Test leave_history table
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leave_history?select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.ok) {
      logTest('Leave history table accessible', true, `Table exists and queryable`)
    } else {
      const errorText = await response.text()
      logTest('Leave history table accessible', false, `Status: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    logTest('Leave history table accessible', false, `Error: ${error.message}`)
  }
}

// Test 5: RLS Policies
async function testRLSPolicies() {
  console.log('\n🛡️ Testing Row Level Security...')
  
  try {
    // Test without authentication (should be restricted)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    })
    
    if (response.status === 401 || response.status === 403) {
      logTest('RLS policies active', true, 'Unauthenticated access properly blocked')
    } else if (response.ok) {
      const data = await response.json()
      if (data.length === 0) {
        logTest('RLS policies active', true, 'No data returned without auth (RLS working)')
      } else {
        logTest('RLS policies active', false, 'Data accessible without authentication')
      }
    } else {
      logTest('RLS policies active', false, `Unexpected response: ${response.status}`)
    }
  } catch (error) {
    logTest('RLS policies active', false, `Error: ${error.message}`)
  }
}

// Test 6: Database Functions
async function testDatabaseFunctions() {
  console.log('\n⚙️ Testing Database Functions...')
  
  try {
    // Test if we can call a function (using service role)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/calculate_working_days`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_date: '2024-01-01',
        end_date: '2024-01-05'
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      logTest('Database functions accessible', true, `calculate_working_days function works`)
    } else {
      const errorText = await response.text()
      logTest('Database functions accessible', false, `Status: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    logTest('Database functions accessible', false, `Error: ${error.message}`)
  }
}

// Test 7: Environment Variables
async function testEnvironmentConfig() {
  console.log('\n🔧 Testing Configuration...')
  
  // Check if URLs are properly formatted
  const urlValid = SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co')
  logTest('Supabase URL format', urlValid, urlValid ? 'URL format is correct' : 'URL format is invalid')
  
  // Check if keys are JWT format
  const anonKeyValid = SUPABASE_ANON_KEY.split('.').length === 3
  logTest('Anon key format', anonKeyValid, anonKeyValid ? 'JWT format is correct' : 'Key format is invalid')
  
  const serviceKeyValid = SUPABASE_SERVICE_ROLE_KEY.split('.').length === 3
  logTest('Service role key format', serviceKeyValid, serviceKeyValid ? 'JWT format is correct' : 'Key format is invalid')
}

// Main verification function
async function verifyAPIs() {
  console.log('🚀 Starting Supabase API Verification...')
  console.log('=' .repeat(50))
  
  // Run all tests
  await testEnvironmentConfig()
  await testConnectivity()
  await testAuthAPI()
  await testAdminAuthAPI()
  await testDatabaseAPI()
  await testRLSPolicies()
  await testDatabaseFunctions()
  
  // Print summary
  console.log('\n' + '=' .repeat(50))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('=' .repeat(50))
  
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`)
  
  if (results.failed > 0) {
    console.log('\n🔍 FAILED TESTS:')
    results.tests
      .filter(test => !test.success)
      .forEach(test => {
        console.log(`   ❌ ${test.name}`)
        if (test.details) {
          console.log(`      ${test.details}`)
        }
      })
    
    console.log('\n🛠️ TROUBLESHOOTING TIPS:')
    console.log('1. Check your Supabase project is active and not paused')
    console.log('2. Verify your API keys are correct and not expired')
    console.log('3. Ensure your database schema has been properly set up')
    console.log('4. Check if RLS policies are configured correctly')
    console.log('5. Verify your project URL matches your actual Supabase project')
  } else {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('Your Supabase configuration is working correctly.')
    console.log('You can now proceed with user creation.')
  }
  
  console.log('\n📋 NEXT STEPS:')
  if (results.failed === 0) {
    console.log('✅ Run user creation script: node src/utils/createUsers.js')
  } else {
    console.log('🔧 Fix the failed tests above, then re-run this verification')
    console.log('🔄 Re-run verification: node src/utils/verifyAPIs.js')
  }
}

// Check if we're running in Node.js
if (typeof window === 'undefined') {
  // Node.js environment
  verifyAPIs().catch(console.error)
} else {
  // Browser environment
  console.log('This script should be run in Node.js with: node src/utils/verifyAPIs.js')
}
