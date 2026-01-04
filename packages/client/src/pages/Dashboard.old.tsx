export function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
          <p className="text-sm text-green-600 mt-2">All time</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Outstanding</h3>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
          <p className="text-sm text-yellow-600 mt-2">Pending payment</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue</h3>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
          <p className="text-sm text-red-600 mt-2">Past due date</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Invoices</h2>
        <p className="text-gray-500">No invoices yet. Create your first invoice to get started!</p>
      </div>
    </div>
  );
}
