import { useDashboardStats } from '@/hooks/api/useDashboard';
import {
  useActiveSession,
  useMostRecentActiveProjectSession,
} from '@/hooks/api/useTimeSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/currency';
import {
  DollarSign,
  Clock,
  FileText,
  Users,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: activeSession } = useActiveSession();
  const { data: recentSession, isLoading: isLoadingRecentSession } = useMostRecentActiveProjectSession();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleContinueTimer = () => {
    if (recentSession?.projectId) {
      navigate('/time-tracking', {
        state: {
          autoStartProjectId: recentSession.projectId,
          autoStartDescription: recentSession.taskDescription || '',
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {activeSession && (
          <Button onClick={() => navigate('/time-tracking')} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Timer Running
          </Button>
        )}
      </div>

      {/* Continue Timer Button */}
      {!activeSession && !isLoadingRecentSession && (
        <>
          {recentSession && recentSession.project ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleContinueTimer}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Timer
              </Button>
              <span className="text-sm text-gray-700">
                <span className="font-medium">{recentSession.project.name}</span>
                {recentSession.client && (
                  <span className="text-gray-500">
                    {' '}
                    - {recentSession.client.name}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No recent sessions with active projects. Start a timer or activate a project to use the Continue Timer feature.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.paidInvoices || 0} paid invoice
              {stats?.paidInvoices !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Outstanding
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.outstandingAmount || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.unpaidInvoices || 0} unpaid invoice
              {stats?.unpaidInvoices !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Overdue
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.overdueAmount || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.overdueInvoices || 0} overdue invoice
              {stats?.overdueInvoices !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Unbilled Time
            </CardTitle>
            <Clock className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(stats?.unbilledAmount || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.unbilledHours?.toFixed(1) || '0.0'} unbilled hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalInvoices || 0}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="text-green-600">
                {stats?.paidInvoices || 0} paid
              </span>
              <span className="text-yellow-600">
                {stats?.unpaidInvoices || 0} unpaid
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.activeProjects || 0}
            </div>
            <Button
              variant="link"
              className="text-xs p-0 h-auto mt-1"
              onClick={() => navigate('/projects')}
            >
              View all projects
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.activeClients || 0}
            </div>
            <Button
              variant="link"
              className="text-xs p-0 h-auto mt-1"
              onClick={() => navigate('/clients')}
            >
              View all clients
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/time-tracking')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Track Time
            </Button>
            <Button
              onClick={() => navigate('/projects')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Manage Projects
            </Button>
            <Button
              onClick={() => navigate('/clients')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Clients
            </Button>
            <Button
              onClick={() => navigate('/invoices/new')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats && stats.overdueAmount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.overdueInvoices} overdue invoice
            {stats.overdueInvoices !== 1 ? 's' : ''} totaling{' '}
            {formatCurrency(stats.overdueAmount)}. Consider following up with
            your clients.
          </AlertDescription>
        </Alert>
      )}

      {stats && stats.unbilledAmount > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            You have {stats.unbilledHours.toFixed(1)} hours of unbilled time
            worth {formatCurrency(stats.unbilledAmount)}. Consider creating an
            invoice.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
