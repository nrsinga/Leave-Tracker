import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { LeaveBalance } from '../components/LeaveBalance'
import { LeaveRequestForm } from '../components/LeaveRequestForm'
import { LeaveRequestsList } from '../components/LeaveRequestsList'
import { Plus } from 'lucide-react'

export function Dashboard() {
  const { employee } = useAuth()
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRequestSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    // Refresh employee data by reloading the page or refetching
    window.location.reload()
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {employee.first_name}!
          </h1>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Request Leave</span>
          </button>
        </div>

        <LeaveBalance employee={employee} />
        <LeaveRequestsList refreshTrigger={refreshTrigger} />

        {showRequestForm && (
          <LeaveRequestForm
            onClose={() => setShowRequestForm(false)}
            onSuccess={handleRequestSuccess}
          />
        )}
      </div>
    </Layout>
  )
}
