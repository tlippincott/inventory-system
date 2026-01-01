import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/api/useProjects';
import {
  useActiveSession,
  useStartSession,
  usePauseSession,
  useResumeSession,
  useStopSession,
  useTimeSessions,
} from '@/hooks/api/useTimeSessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDuration, formatDate, formatTime } from '@/utils/time';
import { formatCurrency } from '@/utils/currency';
import { Play, Pause, Square, Clock } from 'lucide-react';
import type { StartTimeSessionDTO } from '@invoice-system/shared';

export function TimeTracking() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Queries
  const { data: activeSession, isLoading: isLoadingActive } = useActiveSession();
  const { data: projects, isLoading: isLoadingProjects } = useProjects({
    isActive: true,
  });
  const { data: recentSessions, isLoading: isLoadingRecent } = useTimeSessions({
    limit: 10,
    sortBy: 'start_time',
    order: 'desc',
  });

  // Mutations
  const startMutation = useStartSession();
  const pauseMutation = usePauseSession();
  const resumeMutation = useResumeSession();
  const stopMutation = useStopSession();

  // Update timer every second when session is running
  useEffect(() => {
    if (activeSession?.status === 'running') {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession?.status]);

  const handleStart = async () => {
    if (!selectedProjectId) {
      toast({
        title: 'Project Required',
        description: 'Please select a project before starting the timer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data: StartTimeSessionDTO = {
        projectId: selectedProjectId,
        taskDescription: description.trim() || '',
      };

      await startMutation.mutateAsync(data);
      setDescription('');
      toast({
        title: 'Timer Started',
        description: 'Your time tracking session has begun.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start timer',
        variant: 'destructive',
      });
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;

    try {
      await pauseMutation.mutateAsync(activeSession.id);
      toast({
        title: 'Timer Paused',
        description: 'Your time tracking session has been paused.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to pause timer',
        variant: 'destructive',
      });
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;

    try {
      await resumeMutation.mutateAsync(activeSession.id);
      toast({
        title: 'Timer Resumed',
        description: 'Your time tracking session has been resumed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resume timer',
        variant: 'destructive',
      });
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;

    try {
      await stopMutation.mutateAsync(activeSession.id);
      toast({
        title: 'Timer Stopped',
        description: 'Your time tracking session has been stopped and saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to stop timer',
        variant: 'destructive',
      });
    }
  };

  const calculateElapsedTime = (): number => {
    if (!activeSession) return 0;

    // Get accumulated duration from previous pause/resume cycles
    const accumulatedSeconds = activeSession.durationSeconds || 0;

    // If paused, return only the accumulated duration
    if (activeSession.status === 'paused') {
      return accumulatedSeconds;
    }

    // If running, add current elapsed time to accumulated duration
    const startTime = new Date(activeSession.startTime).getTime();
    const currentElapsed = Math.floor((currentTime - startTime) / 1000);
    return accumulatedSeconds + currentElapsed;
  };

  const elapsedSeconds = activeSession ? calculateElapsedTime() : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
      </div>

      {/* Active Timer Widget */}
      <Card className="border-2 border-primary-200 bg-primary-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {activeSession ? 'Active Timer' : 'Start New Timer'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingActive ? (
            <Skeleton className="h-32 w-full" />
          ) : activeSession ? (
            <div className="space-y-4">
              {/* Timer Display */}
              <div className="text-center py-4 bg-white rounded-lg">
                <div className="text-5xl font-bold text-primary-600 font-mono">
                  {formatDuration(elapsedSeconds)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Started at {formatTime(activeSession.startTime)}
                </div>
              </div>

              {/* Active Session Info */}
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Project
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeSession.project?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Client
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeSession.client?.name}
                  </span>
                </div>
                {activeSession.taskDescription && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-700">
                      {activeSession.taskDescription}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-500">
                    Status
                  </span>
                  <Badge
                    variant={
                      activeSession.status === 'running'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {activeSession.status}
                  </Badge>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex gap-2">
                {activeSession.status === 'running' ? (
                  <Button
                    onClick={handlePause}
                    disabled={pauseMutation.isPending}
                    className="flex-1"
                    variant="outline"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={handleResume}
                    disabled={resumeMutation.isPending}
                    className="flex-1"
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button
                  onClick={handleStop}
                  disabled={stopMutation.isPending}
                  className="flex-1"
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Start Timer Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - {project.client?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you working on?"
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={!selectedProjectId || startMutation.isPending}
                className="w-full"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !recentSessions || recentSessions.length === 0 ? (
            <Alert>
              <AlertDescription>
                No time sessions yet. Start tracking your time to see your
                sessions here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {session.project?.name}
                      </span>
                      <span className="text-sm text-gray-500">-</span>
                      <span className="text-sm text-gray-600">
                        {session.client?.name}
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {session.status}
                      </Badge>
                    </div>
                    {session.taskDescription && (
                      <p className="text-sm text-gray-600 mt-1">
                        {session.taskDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{formatDate(session.startTime)}</span>
                      <span>
                        {formatTime(session.startTime)}
                        {session.endTime &&
                          ` - ${formatTime(session.endTime)}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-mono font-semibold text-gray-900">
                      {session.durationSeconds
                        ? formatDuration(session.durationSeconds)
                        : '--:--:--'}
                    </div>
                    {session.billableAmountCents !== null && (
                      <div className="text-sm text-gray-600">
                        {formatCurrency(session.billableAmountCents)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
