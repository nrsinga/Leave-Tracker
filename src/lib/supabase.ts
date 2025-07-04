import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Employee = {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  role: 'user' | 'admin'
  opening_balance: number
  taken: number
  forfeit: number
  pending: number
  created_at: string
  updated_at: string
}

export type LeaveRequest = {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  days_requested: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by?: string
  approved_at?: string
  comments?: string
  created_at: string
  updated_at: string
  employee?: Employee
  approver?: Employee
}

export type LeaveHistory = {
  id: string
  employee_id: string
  leave_request_id?: string
  action: string
  old_values?: any
  new_values?: any
  performed_by: string
  created_at: string
  employee?: Employee
  performer?: Employee
}

// Auth helper functions
export const signUp = async (email: string, password: string, userData: { first_name: string, last_name: string, role?: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: undefined // Disable email confirmation
    }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Employee helper functions
export const getEmployeeProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const getAllEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('first_name')
  
  return { data, error }
}

// Leave request helper functions
export const getLeaveRequests = async (employeeId?: string) => {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees!leave_requests_employee_id_fkey(first_name, last_name, email),
      approver:employees!leave_requests_approved_by_fkey(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data, error } = await query
  return { data, error }
}

export const createLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert([request])
    .select()
    .single()
  
  return { data, error }
}

export const updateLeaveRequest = async (id: string, updates: Partial<LeaveRequest>) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// Leave history helper functions
export const getLeaveHistory = async (employeeId?: string) => {
  let query = supabase
    .from('leave_history')
    .select(`
      *,
      employee:employees!leave_history_employee_id_fkey(first_name, last_name, email),
      performer:employees!leave_history_performed_by_fkey(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data, error } = await query
  return { data, error }
}

// Admin function to create user accounts
export const createUserAccount = async (userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'user' | 'admin'
}) => {
  try {
    // Use the admin API to create user
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create user: ${error}`)
    }

    const result = await response.json()
    return { data: result, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
