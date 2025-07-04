import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  LogOut,
  Plus,
  Filter,
  Search,
  Building2,
  User,
  Mail,
  Badge
} from 'lucide-react'
import { signOut, getAllEmployees, getLeaveRequests, updateLeaveRequest, createLeaveRequest } from '../lib/supabase'
import toast from 'react-hot-toast'
import LeaveRequestForm from './LeaveRequestForm'
import LeaveRequestCard from './LeaveRequestCard'

interface DashboardProps {
  user: any
  employee: any
}

export default function Dashboard({ user, employee }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const isAdmin = employee?.role === 'admin'

  useEffect(() => {
    fetchData()
  }, [employee?.id, isAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch leave requests
      const { data: requests, error: requestsError } = await getLeaveRequests(
        isAdmin ? undefined : employee?.id
      )
      
      if (requestsError) {
        console.error('Error fetching leave requests:', requestsError)
        toast.error('Failed to load leave requests')
      } else {
        setLeaveRequests(requests || [])
      }

      // Fetch all employees if admin
      if (isAdmin) {
        const { data: employees, error: employeesError } = await getAllEmployees()
        if (employeesError) {
          console.error('Error fetching employees:', employeesError)
        } else {
          setAllEmployees(employees || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await updateLeaveRequest(requestId, {
        status: 'approved',
        approved_by: employee.id,
        approved_at: new Date().toISOString()
      })

      if (error) throw error

      toast.success('Leave request approved')
      fetchData()
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Failed to approve request')
    }
  }

  const handleRejectRequest = async (requestId: string, comments?: string) => {
    try {
      const { error } = await updateLeaveRequest(requestId, {
        status: 'rejected',
        approved_by: employee.id,
        approved_at: new Date().toISOString(),
        comments
      })

      if (error) throw error

      toast.success('Leave request rejected')
      fetchData()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    }
  }

  const handleCreateLeaveRequest = async (requestData: any) => {
    try {
      const { error } = await createLeaveRequest({
        ...requestData,
        employee_id: employee.id
      })

      if (error) throw error

      toast.success('Leave request submitted successfully')
      setShowLeaveForm(false)
      fetchData()
    } catch (error) {
      console.error('Error creating leave request:', error)
      toast.error('Failed to submit leave request')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredRequests = leaveRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      request.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const stats = {
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter(r => r.status === 'pending').length,
    approvedRequests: leaveRequests.filter(r => r.status === 'approved').length,
    rejectedRequests: leaveRequests.filter(r => r.status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">IOCO Leave Tracker</h1>
                <p className="text-sm text-gray-500">Employee Leave Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {employee?.first_name} {employee?.last_name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Badge className="h-3 w-3 text-gray-500" />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isAdmin ? 'Administrator' : 'Employee'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {isAdmin ? 'All Requests' : 'My Requests'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'employees'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employees
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.approvedRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.rejectedRequests}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Balance Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Balance</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-indigo-600">{employee?.opening_balance || 0}</p>
                  <p className="text-sm text-gray-600">Opening Balance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">{employee?.taken || 0}</p>
                  <p className="text-sm text-gray-600">Taken</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-yellow-600">{employee?.pending || 0}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">{employee?.forfeit || 0}</p>
                  <p className="text-sm text-gray-600">Forfeit</p>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
                  {!isAdmin && (
                    <button
                      onClick={() => setShowLeaveForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Request</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {leaveRequests.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {leaveRequests.slice(0, 5).map((request) => (
                      <LeaveRequestCard
                        key={request.id}
                        request={request}
                        isAdmin={isAdmin}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No leave requests found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {!isAdmin && (
                  <button
                    onClick={() => setShowLeaveForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Request</span>
                  </button>
                )}
              </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                {filteredRequests.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <LeaveRequestCard
                        key={request.id}
                        request={request}
                        isAdmin={isAdmin}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No requests match your filters</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && isAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">All Employees</h3>
              </div>
              <div className="p-6">
                {allEmployees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allEmployees.map((emp) => (
                      <div key={emp.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {emp.first_name} {emp.last_name}
                            </h4>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              <span>{emp.email}</span>
                            </div>
                            <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                              emp.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {emp.role === 'admin' ? 'Administrator' : 'Employee'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Balance</p>
                            <p className="font-medium">{emp.opening_balance || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Taken</p>
                            <p className="font-medium">{emp.taken || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No employees found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Leave Request Form Modal */}
      {showLeaveForm && (
        <LeaveRequestForm
          onSubmit={handleCreateLeaveRequest}
          onClose={() => setShowLeaveForm(false)}
        />
      )}
    </div>
  )
}
