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
    // Check for existing session
    getCurrentUser().then(({ user, error }) => {
      if (user && !error) {
        setUser(user)
        fetchEmployeeProfile(user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchEmployeeProfile(session.user.id)
      } else {
        setUser(null)
        setEmployee(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchEmployeeProfile = async (userId: string) => {
    try {
      const { data, error } = await getEmployeeProfile(userId)
      if (data && !error) {
        setEmployee(data)
      } else {
        console.error('Error fetching employee profile:', error)
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData: any) => {
    setUser(userData)
    fetchEmployeeProfile(userData.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
