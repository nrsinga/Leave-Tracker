import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttupndvfwjaqvljdsvnz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dXBuZHZmd2phcXZsamRzdm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDUwODUsImV4cCI6MjA2NzAyMTA4NX0.af_hMT-pAX-KMQ2Mztbb_grEGef0qn2IkVKCzyuHfA4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLogin() {
  console.log('🔍 Starting authentication debug...')
  
  const testEmail = 'anna.pohotona@ioco.tech'
  const testPassword = 'password123'
  
  try {
    console.log(`📧 Attempting login with: ${testEmail}`)
    
    // Test the login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    console.log('📊 Login Response:')
    console.log('Data:', data)
    console.log('Error:', error)
    
    if (error) {
      console.error('❌ Login failed:', error.message)
      return
    }
    
    if (data.user) {
      console.log('✅ Login successful!')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      console.log('Email confirmed:', data.user.email_confirmed_at)
      
      // Check if employee record exists
      console.log('\n🔍 Checking employee record...')
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (empError) {
        console.error('❌ Employee lookup failed:', empError.message)
      } else {
        console.log('✅ Employee record found:', employee)
      }
      
      // Sign out after test
      await supabase.auth.signOut()
      console.log('🚪 Signed out after test')
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

// Also test the current session
async function checkCurrentSession() {
  console.log('\n🔍 Checking current session...')
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('❌ Session check failed:', error.message)
  } else if (session) {
    console.log('✅ Active session found:', session.user.email)
  } else {
    console.log('ℹ️ No active session')
  }
}

// Run the debug
debugLogin().then(() => {
  return checkCurrentSession()
}).then(() => {
  console.log('\n🏁 Debug complete!')
})
