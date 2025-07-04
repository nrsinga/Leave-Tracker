import { useState, useEffect } from 'react'
import { supabase, Employee, LeaveRequest } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { format } from 'date-fns'
import { Users, Calendar, CheckCircle, XCircle, Clock, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export function Admin() {
  const { isAdmin } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'employees' | 'requests'>('employees')

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin])

  const fetchData = async () => {
    try {
      const [employeesResult, requestsResult] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .order('first_name'),
        supabase
          .from('leave_requests')
          .select(`
            *,
            employee:employees!leave_requests_employee_id_fkey(first_name, last_name, employee_code)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      ])

      if (employeesResult.error) throw employeesResult.error
      if (requestsResult.error) throw requestsResult.error

      setEmployees(employeesResult.data || [])
      setPendingRequests(requestsResult.data || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveAction = async (requestId: string, action: 'approved' | 'rejected', comments?: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: action,
          approved_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success(`Leave request ${action} successfully`)
      fetchData() // Refresh data
    } catch (error) {
      console.error(`Error ${action} leave request:`, error)
      toast.error(`Failed to ${action} leave request`)
    }
  }

  const updateEmployeeBalance = async (employeeId: string, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', employeeId)

      if (error) throw error

      toast.success('Employee balance updated successfully')
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error updating employee balance:', error)
      toast.error('Failed to update employee balance')
    }
  }

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.employee_code}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedTab('employees')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'employees'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Employees
              </button>
              <button
                onClick={() => setSelectedTab('requests')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'requests'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Pending Requests ({pendingRequests.length})
              </button>
            </div>
          </div>
        </div>

        {selectedTab === 'employees' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Employee Management</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opening Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taken
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Forfeit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    const available = employee.opening_balance - employee.taken - employee.forfeit - employee.pending
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employee_code} • {employee.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={employee.opening_balance}
                            onChange={(e) => updateEmployeeBalance(employee.id, 'opening_balance', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={employee.taken}
                            onChange={(e) => updateEmployeeBalance(employee.id, 'taken', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={employee.forfeit}
                            onChange={(e) => updateEmployeeBalance(employee.id, 'forfeit', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.pending.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {available.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'requests' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingRequests.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending leave requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">
                            {request.employee?.first_name} {request.employee?.last_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({request.employee?.employee_code})
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium capitalize">{request.leave_type} Leave</span>
                          <span className="mx-2">•</span>
                          {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          <span className="mx-2">•</span>
                          {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}
                        </div>
                        {request.reason && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>Reason:</strong> {request.reason}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          Requested {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleLeaveAction(request.id, 'approved')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            const comments = prompt('Reason for rejection (optional):')
                            handleLeaveAction(request.id, 'rejected', comments || undefined)
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
