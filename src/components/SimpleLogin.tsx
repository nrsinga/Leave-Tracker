import React, { useState } from 'react'
import { LogIn, Building2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function SimpleLogin() {
  const [email, setEmail] = useState('anna.pohotona@ioco.tech')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log('Attempting login with:', { email, password })
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in response:', { data, error: signInError })
      setDebugInfo({ data, error: signInError })

      if (signInError) {
        setError(signInError.message)
        toast.error(signInError.message)
        return
      }

      if (data.user) {
        console.log('Login successful, user:', data.user)
        toast.success('Login successful!')
        
        // Try to fetch employee data
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', data.user.id)
          .single()

        console.log('Employee fetch:', { employee, empError })
        
        if (empError) {
          console.error('Employee fetch error:', empError)
          toast.error('Could not load employee data')
        } else {
          console.log('Employee loaded:', employee)
          toast.success(`Welcome ${employee.first_name}!`)
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('count')
      console.log('Connection test:', { data, error })
      if (error) {
        toast.error('Database connection failed')
      } else {
        toast.success('Database connection successful')
      }
    } catch (err) {
      console.error('Connection error:', err)
      toast.error('Connection failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            IOCO Leave Tracker
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your leave requests
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Login Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="firstname.surname@ioco.tech"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={testConnection}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Test DB
              </button>
            </div>

            {debugInfo && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h4>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Test credentials: anna.pohotona@ioco.tech / password123</p>
          <p className="mt-1">Or: charl.smit@ioco.tech / password123</p>
        </div>
      </div>
    </div>
  )
}
