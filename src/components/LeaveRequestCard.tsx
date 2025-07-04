import React, { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  AlertCircle,
  FileText
} from 'lucide-react'

interface LeaveRequestCardProps {
  request: any
  isAdmin: boolean
  onApprove: (id: string) => void
  onReject: (id: string, comments?: string) => void
}

export default function LeaveRequestCard({ request, isAdmin, onApprove, onReject }: LeaveRequestCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComments, setRejectComments] = useState('')

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLeaveType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleReject = () => {
    onReject(request.id, rejectComments)
    setShowRejectModal(false)
    setRejectComments('')
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-3">
              {isAdmin && request.employee && (
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 p-1 rounded-full">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {request.employee.first_name} {request.employee.last_name}
                  </span>
                </div>
              )}
              
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Leave Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{formatLeaveType(request.leave_type)}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(request.start_date)}
                  {request.start_date !== request.end_date && (
                    <> - {formatDate(request.end_date)}</>
                  )}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{request.days_requested} {request.days_requested === 1 ? 'day' : 'days'}</span>
              </div>
            </div>

            {/* Reason */}
            {request.reason && (
              <div className="mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Reason:</span> {request.reason}
                </p>
              </div>
            )}

            {/* Comments */}
            {request.comments && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Comments:</span>
                </div>
                <p className="text-sm text-gray-600">{request.comments}</p>
              </div>
            )}

            {/* Approval Info */}
            {request.approved_by && request.approver && (
              <div className="text-xs text-gray-500">
                {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver.first_name} {request.approver.last_name}
                {request.approved_at && (
                  <> on {formatDate(request.approved_at)}</>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {isAdmin && request.status === 'pending' && (
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onApprove(request.id)}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Leave Request</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to reject this leave request? You can optionally provide comments.
              </p>
              
              <textarea
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Comments (optional)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 mb-4"
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
