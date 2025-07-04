import { useState, useEffect } from 'react'
import { supabase, LeaveRequest } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface LeaveRequestsListProps {
  refreshTrigger?: number
}

export function LeaveRequestsList({ refreshTrigger }: LeaveRequestsListProps) {
  const { employee } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [employee, refreshTrigger])

  const fetchRequests = async () => {
    if (!employee) return

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees!leave_requests_employee_id_fkey(first_name, last_name),
          approver:employees!leave_requests_approved_by_fkey(first_name, last_name)
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">My Leave Requests</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No leave requests found</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900 capitalize">
                      {request.leave_type} Leave
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                    <span className="ml-2">({request.days_requested} day{request.days_requested !== 1 ? 's' : ''})</span>
                  </div>
                  {request.reason && (
                    <div className="mt-1 text-sm text-gray-500">
                      {request.reason}
                    </div>
                  )}
                  {request.comments && (
                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      <strong>Manager Comment:</strong> {request.comments}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Requested {format(new Date(request.created_at), 'MMM dd, yyyy')}</div>
                  {request.approved_at && request.approver && (
                    <div className="mt-1">
                      Approved by {request.approver.first_name} {request.approver.last_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
