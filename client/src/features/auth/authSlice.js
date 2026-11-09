import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client.js';

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { return (await api.get('/auth/me')).data.data.user; } catch (e) { return rejectWithValue(e.message); }
});
export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try { return (await api.post('/auth/register', data)).data.data.user; } catch (e) { return rejectWithValue(e.message); }
});
export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try { return (await api.post('/auth/login', creds)).data.data.user; } catch (e) { return rejectWithValue(e.message); }
});
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    try {
      localStorage.removeItem('travelos_token');
    } catch {}
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null }, // status: idle | loading | ready
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.status = 'ready'; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.status = 'ready'; })
      .addCase(register.pending, (s) => { s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.user = a.payload; s.status = 'ready'; })
      .addCase(register.rejected, (s, a) => { s.error = a.payload; })
      .addCase(login.pending, (s) => { s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.user = a.payload; s.status = 'ready'; })
      .addCase(login.rejected, (s, a) => { s.error = a.payload; })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.status = 'ready'; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
