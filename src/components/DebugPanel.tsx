import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function DebugPanel() {
  const [debugResults, setDebugResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
    setDebugResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }])
  }

  const runFullDiagnostic = async () => {
    setIsRunning(true)
    setDebugResults([])

    try {
      // Test 1: Check current session
      addResult('Session', 'warning', 'Checking current session...')
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          addResult('Session', 'error', `Session check failed: ${sessionError.message}`, sessionError)
        } else if (session) {
          addResult('Session', 'success', `Active session found for: ${session.user.email}`, {
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role
          })
          
          // Test 2: Check if employee record exists for this user
          addResult('Employee Check', 'warning', 'Checking employee record...')
          
          try {
            const { data: employee, error: empError } = await supabase
              .from('employees')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (empError) {
              addResult('Employee Check', 'error', `Employee record not found: ${empError.message}`, empError)
              
              // Try to find by email
              addResult('Email Lookup', 'warning', 'Trying to find employee by email...')
              
              const { data: empByEmail, error: emailError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', session.user.email)
                .single()
              
              if (emailError) {
                addResult('Email Lookup', 'error', `No employee found by email: ${emailError.message}`, emailError)
              } else {
                addResult('Email Lookup', 'success', 'Employee found by email!', empByEmail)
                
                // Try to update the ID
                addResult('ID Update', 'warning', 'Attempting to update employee ID...')
                
                const { data: updated, error: updateError } = await supabase
                  .from('employees')
                  .update({ id: session.user.id })
                  .eq('email', session.user.email)
                  .select()
                  .single()
                
                if (updateError) {
                  addResult('ID Update', 'error', `Failed to update ID: ${updateError.message}`, updateError)
                } else {
                  addResult('ID Update', 'success', 'Employee ID updated successfully!', updated)
                }
              }
            } else {
              addResult('Employee Check', 'success', 'Employee record found!', employee)
            }
          } catch (err: any) {
            addResult('Employee Check', 'error', `Employee query failed: ${err.message}`, err)
          }
          
        } else {
          addResult('Session', 'warning', 'No active session found')
        }
      } catch (err: any) {
        addResult('Session', 'error', `Session check error: ${err.message}`, err)
      }

      // Test 3: Check RLS policies
      addResult('RLS Test', 'warning', 'Testing RLS policies...')
      
      try {
        const { data: employees, error: rlsError } = await supabase
          .from('employees')
          .select('id, email, first_name, last_name, role')
          .limit(5)
        
        if (rlsError) {
          addResult('RLS Test', 'error', `RLS policy blocking access: ${rlsError.message}`, rlsError)
        } else {
          addResult('RLS Test', 'success', `RLS policies working, can see ${employees.length} employees`, employees)
        }
      } catch (err: any) {
        addResult('RLS Test', 'error', `RLS test failed: ${err.message}`, err)
      }

      // Test 4: Test direct database connection
      addResult('DB Connection', 'warning', 'Testing database connection...')
      
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('count')
          .limit(1)
        
        if (error) {
          addResult('DB Connection', 'error', `Database connection failed: ${error.message}`, error)
        } else {
          addResult('DB Connection', 'success', 'Database connection successful')
        }
      } catch (err: any) {
        addResult('DB Connection', 'error', `Connection error: ${err.message}`, err)
      }

    } catch (err: any) {
      addResult('System', 'error', `System error: ${err.message}`, err)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <Bug className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Bug className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Authentication Debug Panel</h1>
            </div>
            <button
              onClick={runFullDiagnostic}
              disabled={isRunning}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Full Diagnostic'}
            </button>
          </div>

          <div className="space-y-4">
            {debugResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start">
                  {getStatusIcon(result.status)}
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{result.test}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Show Details</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {debugResults.length === 0 && !isRunning && (
            <div className="text-center py-12">
              <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Click "Run Full Diagnostic" to start debugging</p>
            </div>
            )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) {
                    console.log('Current user:', user)
                    addResult('User Info', 'success', `Current user: ${user.email}`, user)
                  }
                }}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded mr-2"
              >
                Show Current User
              </button>
              <button
                onClick={async () => {
                  const { data, error } = await supabase.from('employees').select('*').limit(10)
                  addResult('All Employees', error ? 'error' : 'success', 
                    error ? `Error: ${error.message}` : `Found ${data.length} employees`, 
                    error || data)
                }}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded mr-2"
              >
                List All Employees
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
