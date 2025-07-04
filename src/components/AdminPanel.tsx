import React, { useState, useEffect } from 'react'
import { supabase, LeaveRequest } from '../lib/supabase'
import { Users, CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface AdminPanelProps {
  employee: any
}

export default function AdminPanel({ employee }: AdminPanelProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mock data for admin panel
      const mockEmployees = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          employee_code: 'EMP001',
          first_name: 'Anna',
          last_name: 'Pohotona',
          email: 'anna.pohotona@ioco.tech',
          role: 'admin',
          opening_balance: 25,
          taken: 5,
          forfeit: 0,
          pending: 3
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          employee_code: 'EMP002',
          first_name: 'Charl',
          last_name: 'Smit',
          email: 'charl.smit@ioco.tech',
          role: 'employee',
          opening_balance: 22,
          taken: 8,
          forfeit: 1,
          pending: 2
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          employee_code: 'EMP003',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@ioco.tech',
          role: 'employee',
          opening_balance: 20,
          taken: 3,
          forfeit: 0,
          pending: 5
        }
      ]

      const mockRequests: LeaveRequest[] = [
        {
          id: '1',
          employee_id: '550e8400-e29b-41d4-a716-446655440002',
          leave_type: 'Annual Leave',
          start_date: '2024-01-20',
          end_date: '2024-01-24',
          days_requested: 5,
          reason: 'Family vacation to Cape Town',
          status: 'pending',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          employee_id: '550e8400-e29b-41d4-a716-446655440003',
          leave_type: 'Sick Leave',
          start_date: '2024-01-18',
          end_date: '2024-01-19',
          days_requested: 2,
          reason: 'Medical procedure',
          status: 'pending',
          created_at: '2024-01-16T14:30:00Z',
          updated_at: '2024-01-16T14:30:00Z'
        },
        {
          id: '3',
          employee_id: '550e8400-e29b-41d4-a716-446655440002',
          leave_type: 'Personal Leave',
          start_date: '2024-01-25',
          end_date: '2024-01-25',
          days_requested: 1,
          reason: 'Personal appointment',
          status: 'approved',
          approved_by: employee.id,
          approved_at: '2024-01-17T10:00:00Z',
          comments: 'Approved',
          created_at: '2024-01-16T11:00:00Z',
          updated_at: '2024-01-17T10:00:00Z'
        }
      ]

      setEmployees(mockEmployees)
      setLeaveRequests(mockRequests)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      // Mock approval - in real app this would update Supabase
      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status, 
                approved_by: employee.id,
                approved_at: new Date().toISOString(),
                comments: comments || '',
                updated_at: new Date().toISOString()
              }
            : req
        )
      )
      
      toast.success(`Leave request ${status}`)
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Error updating request')
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'
  }

  const filteredRequests = leaveRequests.filter(req => 
    filter === 'all' || req.status === filter
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-indigo-900 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Admin Panel - Leave Management
        </h2>
        <p className="text-indigo-700 mt-1">
          Manage leave requests and employee balances
        </p>
      </div>

      {/* Employee Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employee Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {emp.first_name} {emp.last_name}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    emp.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {emp.role}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">{emp.email}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Balance:</span>
                    <span className="ml-1 font-medium">{emp.opening_balance}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Taken:</span>
                    <span className="ml-1 font-medium">{emp.taken}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pending:</span>
                    <span className="ml-1 font-medium">{emp.pending}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available:</span>
                    <span className="ml-1 font-medium text-green-600">
                      {emp.opening_balance - emp.taken - emp.forfeit - emp.pending}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {getEmployeeName(request.employee_id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1">{request.leave_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Days:</span>
                        <span className="ml-1 font-medium">{request.days_requested}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Requested:</span>
                        <span className="ml-1">{format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Reason:</span>
                        <span className="ml-1">{request.reason}</span>
                      </div>
                    )}

                    {request.comments && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Comments:</span>
                        <span className="ml-1">{request.comments}</span>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApproval(request.id, 'approved', 'Approved')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(request.id, 'rejected', 'Rejected')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No {filter !== 'all' ? filter : ''} leave requests found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
