import { Employee } from '../lib/supabase'

interface LeaveBalanceProps {
  employee: Employee
}

export function LeaveBalance({ employee }: LeaveBalanceProps) {
  const available = employee.opening_balance - employee.taken - employee.forfeit - employee.pending
  const overdue = available < 0 ? Math.abs(available) : 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{employee.opening_balance}</div>
          <div className="text-sm text-gray-600">Opening Balance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{employee.taken}</div>
          <div className="text-sm text-gray-600">Taken</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{employee.forfeit}</div>
          <div className="text-sm text-gray-600">Forfeit</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{employee.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {available >= 0 ? available.toFixed(2) : '0.00'}
          </div>
          <div className="text-sm text-gray-600">Available</div>
          {overdue > 0 && (
            <div className="text-xs text-red-600 mt-1">
              Overdue: {overdue.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
