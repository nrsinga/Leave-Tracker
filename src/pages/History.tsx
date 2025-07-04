import { useState, useEffect } from 'react'
import { supabase, LeaveHistory } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { format } from 'date-fns'
import { History as HistoryIcon, User, Calendar } from 'lucide-react'

export function History() {
  const { employee } = useAuth()
  const [history, setHistory] = useState<LeaveHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [employee])

  const fetchHistory = async () => {
    if (!employee) return

    try {
      const { data, error } = await supabase
        .from('leave_history')
        .select(`
          *,
          employee:employees!leave_history_employee_id_fkey(first_name, last_name),
          performer:employees!leave_history_performed_by_fkey(first_name, last_name)
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching leave history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'leave_requested':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'leave_approved':
        return <Calendar className="w-4 h-4 text-green-600" />
      case 'leave_rejected':
        return <Calendar className="w-4 h-4 text-red-600" />
      default:
        return <HistoryIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'leave_requested':
        return 'bg-blue-100 text-blue-800'
      case 'leave_approved':
        return 'bg-green-100 text-green-800'
      case 'leave_rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAction = (action: string) => {
    return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {history.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No history found</p>
              </div>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                          {formatAction(entry.action)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      
                      {entry.new_values && (
                        <div className="mt-2 text-sm text-gray-700">
                          {entry.action === 'leave_requested' && (
                            <div>
                              Requested {entry.new_values.days} day{entry.new_values.days !== 1 ? 's' : ''} leave
                              {entry.new_values.start_date && entry.new_values.end_date && (
                                <span className="ml-1">
                                  from {format(new Date(entry.new_values.start_date), 'MMM dd')} to {format(new Date(entry.new_values.end_date), 'MMM dd')}
                                </span>
                              )}
                            </div>
                          )}
                          {(entry.action === 'leave_approved' || entry.action === 'leave_rejected') && (
                            <div>
                              {entry.new_values.days} day{entry.new_values.days !== 1 ? 's' : ''} leave {entry.action.split('_')[1]}
                            </div>
                          )}
                        </div>
                      )}

                      {entry.performer && entry.performed_by !== entry.employee_id && (
                        <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>by {entry.performer.first_name} {entry.performer.last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
