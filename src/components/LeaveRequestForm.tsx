import React, { useState } from 'react'
import { X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface LeaveRequestFormProps {
  onSubmit: (data: any) => void
  onClose: () => void
}

export default function LeaveRequestForm({ onSubmit, onClose }: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false,
    half_day_period: 'morning'
  })
  const [loading, setLoading] = useState(false)

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'study', label: 'Study Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' }
  ]

  const calculateWorkingDays = (startDate: string, endDate: string, isHalfDay: boolean) => {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) return 0
    
    let workingDays = 0
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay()
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // If it's a half day and only one day, return 0.5
    if (isHalfDay && workingDays === 1) {
      return 0.5
    }
    
    return workingDays
  }

  const workingDays = calculateWorkingDays(formData.start_date, formData.end_date, formData.is_half_day)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates')
      return
    }
    
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('End date must be after start date')
      return
    }
    
    if (workingDays <= 0) {
      toast.error('Please select valid working days')
      return
    }

    setLoading(true)
    
    try {
      await onSubmit({
        ...formData,
        days_requested: workingDays,
        status: 'pending'
      })
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">New Leave Request</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              {leaveTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_half_day"
              checked={formData.is_half_day}
              onChange={(e) => setFormData({ 
                ...formData, 
                is_half_day: e.target.checked,
                end_date: e.target.checked ? formData.start_date : formData.end_date
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_half_day" className="text-sm font-medium text-gray-700">
              Half Day Leave
            </label>
          </div>

          {/* Half Day Period */}
          {formData.is_half_day && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Half Day Period
              </label>
              <select
                value={formData.half_day_period}
                onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="morning">Morning (AM)</option>
                <option value="afternoon">Afternoon (PM)</option>
              </select>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ 
                ...formData, 
                start_date: e.target.value,
                end_date: formData.is_half_day ? e.target.value : formData.end_date
              })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* End Date */}
          {!formData.is_half_day && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          )}

          {/* Working Days Display */}
          {workingDays > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Working Days: {workingDays} {workingDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              {formData.is_half_day && (
                <p className="text-xs text-blue-700 mt-1">
                  Half day ({formData.half_day_period})
                </p>
              )}
            </div>
          )}

          {/* Weekend Warning */}
          {formData.start_date && formData.end_date && workingDays === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Selected dates contain only weekends
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Reason (Optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Please provide a reason for your leave request..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || workingDays <= 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
