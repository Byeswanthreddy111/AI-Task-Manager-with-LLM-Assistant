import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

const initialState = {
  tasks: [],
  currentTask: null,
  stats: null,
  loading: false,
  error: null,
  filters: {
    completed: null,
    priority: null,
    category: null,
    search: '',
  },
};

// Fetch all tasks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await api.get(`/tasks?${params.toString()}`);
      return response.data.tasks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tasks');
    }
  }
);

// Create task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create task');
    }
  }
);

// Update task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update task');
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete task');
    }
  }
);

// Toggle task completion
export const toggleTaskComplete = createAsyncThunk(
  'tasks/toggleComplete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${id}/toggle`);
      return { id, completed: response.data.completed };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to toggle task');
    }
  }
);

// Fetch dashboard stats
export const fetchDashboardStats = createAsyncThunk(
  'tasks/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch stats');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
      })
      // Toggle complete
      .addCase(toggleTaskComplete.fulfilled, (state, action) => {
        const task = state.tasks.find(t => t.id === action.payload.id);
        if (task) {
          task.completed = action.payload.completed;
        }
      })
      // Fetch stats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setCurrentTask, clearError } = taskSlice.actions;
export default taskSlice.reducer;