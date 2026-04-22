import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

const initialState = {
  messages: [],
  sessionId: null,
  loading: false,
  error: null,
  suggestions: null,
  analysis: null,
};

// Send chat message
export const sendChatMessage = createAsyncThunk(
  'ai/sendMessage',
  async ({ message, sessionId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/chat', { message, sessionId });
      return {
        userMessage: message,
        aiMessage: response.data.message,
        sessionId: response.data.sessionId,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send message');
    }
  }
);

// Get task suggestions
export const getTaskSuggestions = createAsyncThunk(
  'ai/getSuggestions',
  async (input, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/suggestions', { input });
      return response.data.suggestions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get suggestions');
    }
  }
);

// Analyze productivity
export const analyzeProductivity = createAsyncThunk(
  'ai/analyzeProductivity',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/ai/analyze');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to analyze productivity');
    }
  }
);

// Categorize task
export const categorizeTask = createAsyncThunk(
  'ai/categorizeTask',
  async ({ title, description }, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/categorize', { title, description });
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to categorize task');
    }
  }
);

// Suggest priority
export const suggestPriority = createAsyncThunk(
  'ai/suggestPriority',
  async ({ title, description, due_date }, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/priority', { title, description, due_date });
      return response.data.priority;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to suggest priority');
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.messages = [];
      state.sessionId = null;
    },
    clearSuggestions: (state) => {
      state.suggestions = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send message
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(
          { role: 'user', content: action.payload.userMessage, timestamp: new Date().toISOString() },
          { role: 'assistant', content: action.payload.aiMessage, timestamp: new Date().toISOString() }
        );
        state.sessionId = action.payload.sessionId;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get suggestions
      .addCase(getTaskSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTaskSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload;
      })
      .addCase(getTaskSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Analyze productivity
      .addCase(analyzeProductivity.pending, (state) => {
        state.loading = true;
      })
      .addCase(analyzeProductivity.fulfilled, (state, action) => {
        state.loading = false;
        state.analysis = action.payload;
      })
      .addCase(analyzeProductivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, clearSuggestions, clearError } = aiSlice.actions;
export default aiSlice.reducer;