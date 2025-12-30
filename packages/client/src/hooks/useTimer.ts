import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { tick, syncWithServer, reset } from '@/store/slices/timerSlice';
import {
  useActiveSession,
  usePauseSession,
  useResumeSession,
  useStopSession,
} from './api/useTimeSessions';
import { calculateDuration } from '@/utils/time';

/**
 * Combined timer hook that manages:
 * - Server state (React Query polling for active session)
 * - Local state (Redux for smooth UI timer ticks)
 * - Timer controls (pause/resume/stop)
 *
 * Strategy:
 * 1. Poll server every 1 second for active session
 * 2. Sync local timer with server time
 * 3. Increment local timer every second for smooth display
 * 4. This prevents drift while maintaining smooth UI
 */
export function useTimer() {
  const dispatch = useAppDispatch();
  const localElapsed = useAppSelector(
    (state) => state.timer.localElapsedSeconds
  );

  // Fetch active session from server (polls every 1 second)
  const { data: activeSession, isLoading } = useActiveSession();

  // Timer control mutations
  const pauseMutation = usePauseSession();
  const resumeMutation = useResumeSession();
  const stopMutation = useStopSession();

  // Sync local timer with server data whenever active session changes
  useEffect(() => {
    if (activeSession && activeSession.status === 'running') {
      // Calculate elapsed time from server timestamps
      const serverElapsed = calculateDuration(activeSession.startTime);
      dispatch(syncWithServer({ elapsedSeconds: serverElapsed }));
    } else if (activeSession && activeSession.status === 'paused') {
      // For paused sessions, use the durationSeconds if available
      if (activeSession.durationSeconds) {
        dispatch(
          syncWithServer({ elapsedSeconds: activeSession.durationSeconds })
        );
      }
    } else {
      // No active session or session stopped
      dispatch(reset());
    }
  }, [activeSession, dispatch]);

  // Local timer tick (increments every second when running)
  useEffect(() => {
    if (activeSession?.status === 'running') {
      const interval = setInterval(() => {
        dispatch(tick());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession?.status, dispatch]);

  // Timer control functions
  const pause = useCallback(() => {
    if (activeSession) {
      pauseMutation.mutate(activeSession.id);
    }
  }, [activeSession, pauseMutation]);

  const resume = useCallback(() => {
    if (activeSession) {
      resumeMutation.mutate(activeSession.id);
    }
  }, [activeSession, resumeMutation]);

  const stop = useCallback(() => {
    if (activeSession) {
      stopMutation.mutate(activeSession.id);
    }
  }, [activeSession, stopMutation]);

  return {
    // Session data
    activeSession,
    isLoading,

    // Timer state
    elapsedSeconds: localElapsed,
    isRunning: activeSession?.status === 'running',
    isPaused: activeSession?.status === 'paused',
    hasActiveSession: !!activeSession,

    // Timer controls
    pause,
    resume,
    stop,

    // Loading states for controls
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isStopping: stopMutation.isPending,
  };
}
