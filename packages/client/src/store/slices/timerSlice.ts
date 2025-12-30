import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimerState {
  /**
   * Local elapsed time in seconds (incremented every second)
   * Synced with server periodically to prevent drift
   */
  localElapsedSeconds: number;

  /**
   * Timestamp of last sync with server
   */
  lastSyncTime: number;
}

const initialState: TimerState = {
  localElapsedSeconds: 0,
  lastSyncTime: 0,
};

export const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    /**
     * Increment local timer by 1 second
     * Called every second when timer is running
     */
    tick: (state) => {
      state.localElapsedSeconds += 1;
    },

    /**
     * Sync local timer with server time
     * Called when active session is fetched from server
     */
    syncWithServer: (
      state,
      action: PayloadAction<{ elapsedSeconds: number }>
    ) => {
      state.localElapsedSeconds = action.payload.elapsedSeconds;
      state.lastSyncTime = Date.now();
    },

    /**
     * Reset timer to zero
     * Called when session is stopped or no active session
     */
    reset: (state) => {
      state.localElapsedSeconds = 0;
      state.lastSyncTime = 0;
    },
  },
});

export const { tick, syncWithServer, reset } = timerSlice.actions;
export default timerSlice.reducer;
