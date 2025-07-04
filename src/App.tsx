import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { supabase, getCurrentUser, getEmployeeProfile } from './lib/supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [user, setUser] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🚀 App initializing...')
    
    // Check for existing session
    getCurrentUser().then(({ user, error }) => {
      console.log('🔍 Initial user check:', { user, error })
      
      if (user && !error) {
        console.log('✅ Found existing user, fetching profile...')
        setUser(user)
        fetchEmployeeProfile(user.id)
      } else {
        console.log('❌ No existing user found')
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', { event, session: !!session })
      
      if (session?.user) {
        console.log('✅ User authenticated via auth change:', session.user)
        setUser(session.user)
        await fetchEmployeeProfile(session.user.id)
      } else {
        console.log('❌ User signed out or no session')
        setUser(null)
        setEmployee(null)
        setLoading(false)
      }
    })

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  const fetchEmployeeProfile = async (userId: string) => {
    console.log('👤 Fetching employee profile for:', userId)
    
    try {
      const { data, error } = await getEmployeeProfile(userId)
      console.log('👤 Employee profile result:', { data, error })
      
      if (data && !error) {
        console.log('✅ Employee profile loaded:', data)
        setEmployee(data)
      } else {
        console.error('❌ Error fetching employee profile:', error)
        // Don't set loading to false here - let the user stay on login
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching employee profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData: any) => {
    console.log('🔐 handleLogin called with:', userData)
    setUser(userData)
    setLoading(true) // Set loading while fetching employee profile
    fetchEmployeeProfile(userData.id)
  }

  console.log('🎯 App render state:', { 
    user: !!user, 
    employee: !!employee, 
    loading,
    userEmail: user?.email,
    employeeName: employee ? `${employee.first_name} ${employee.last_name}` : null
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <Toaster position="top-right" />
      {user && employee ? (
        <Dashboard user={user} employee={employee} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App
