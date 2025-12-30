import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SessionFilters, ProjectFilters, ClientFilters } from '@/types';

interface UiState {
  /**
   * Time session filters
   */
  sessionFilters: SessionFilters;

  /**
   * Project filters
   */
  projectFilters: ProjectFilters;

  /**
   * Client filters
   */
  clientFilters: ClientFilters;

  /**
   * Project dialog state
   */
  projectDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit' | null;
    projectId: string | null;
  };

  /**
   * Client dialog state
   */
  clientDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit' | null;
    clientId: string | null;
  };

  /**
   * Session dialog state
   */
  sessionDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit' | null;
    sessionId: string | null;
  };

  /**
   * Start timer dialog state
   */
  startTimerDialog: {
    isOpen: boolean;
  };

  /**
   * View preferences
   */
  preferences: {
    sessionViewMode: 'table' | 'list';
    projectViewMode: 'grid' | 'table';
  };
}

const initialState: UiState = {
  sessionFilters: {},
  projectFilters: {},
  clientFilters: {},
  projectDialog: {
    isOpen: false,
    mode: null,
    projectId: null,
  },
  clientDialog: {
    isOpen: false,
    mode: null,
    clientId: null,
  },
  sessionDialog: {
    isOpen: false,
    mode: null,
    sessionId: null,
  },
  startTimerDialog: {
    isOpen: false,
  },
  preferences: {
    sessionViewMode: 'table',
    projectViewMode: 'grid',
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Session filters
    setSessionFilters: (state, action: PayloadAction<SessionFilters>) => {
      state.sessionFilters = action.payload;
    },

    resetSessionFilters: (state) => {
      state.sessionFilters = {};
    },

    // Project filters
    setProjectFilters: (state, action: PayloadAction<ProjectFilters>) => {
      state.projectFilters = action.payload;
    },

    resetProjectFilters: (state) => {
      state.projectFilters = {};
    },

    // Client filters
    setClientFilters: (state, action: PayloadAction<ClientFilters>) => {
      state.clientFilters = action.payload;
    },

    resetClientFilters: (state) => {
      state.clientFilters = {};
    },

    // Project dialog
    openProjectDialog: (
      state,
      action: PayloadAction<{ mode: 'create' | 'edit'; projectId?: string }>
    ) => {
      state.projectDialog.isOpen = true;
      state.projectDialog.mode = action.payload.mode;
      state.projectDialog.projectId = action.payload.projectId || null;
    },

    closeProjectDialog: (state) => {
      state.projectDialog.isOpen = false;
      state.projectDialog.mode = null;
      state.projectDialog.projectId = null;
    },

    // Client dialog
    openClientDialog: (
      state,
      action: PayloadAction<{ mode: 'create' | 'edit'; clientId?: string }>
    ) => {
      state.clientDialog.isOpen = true;
      state.clientDialog.mode = action.payload.mode;
      state.clientDialog.clientId = action.payload.clientId || null;
    },

    closeClientDialog: (state) => {
      state.clientDialog.isOpen = false;
      state.clientDialog.mode = null;
      state.clientDialog.clientId = null;
    },

    // Session dialog
    openSessionDialog: (
      state,
      action: PayloadAction<{ mode: 'create' | 'edit'; sessionId?: string }>
    ) => {
      state.sessionDialog.isOpen = true;
      state.sessionDialog.mode = action.payload.mode;
      state.sessionDialog.sessionId = action.payload.sessionId || null;
    },

    closeSessionDialog: (state) => {
      state.sessionDialog.isOpen = false;
      state.sessionDialog.mode = null;
      state.sessionDialog.sessionId = null;
    },

    // Start timer dialog
    openStartTimerDialog: (state) => {
      state.startTimerDialog.isOpen = true;
    },

    closeStartTimerDialog: (state) => {
      state.startTimerDialog.isOpen = false;
    },

    // View preferences
    setSessionViewMode: (
      state,
      action: PayloadAction<'table' | 'list'>
    ) => {
      state.preferences.sessionViewMode = action.payload;
    },

    setProjectViewMode: (
      state,
      action: PayloadAction<'grid' | 'table'>
    ) => {
      state.preferences.projectViewMode = action.payload;
    },
  },
});

export const {
  setSessionFilters,
  resetSessionFilters,
  setProjectFilters,
  resetProjectFilters,
  setClientFilters,
  resetClientFilters,
  openProjectDialog,
  closeProjectDialog,
  openClientDialog,
  closeClientDialog,
  openSessionDialog,
  closeSessionDialog,
  openStartTimerDialog,
  closeStartTimerDialog,
  setSessionViewMode,
  setProjectViewMode,
} = uiSlice.actions;

export default uiSlice.reducer;
