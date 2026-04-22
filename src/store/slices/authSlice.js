import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, signUp as signUpApi, updateProfile as updateProfileApi } from '../../services/authService';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await loginApi(email, password);
      return data;
    } catch (err) {
      return rejectWithValue(err.userMessage || err.response?.data?.message || err.message || 'Login failed');
    }
  }
);

export const signUpAsync = createAsyncThunk(
  'auth/signUp',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await signUpApi(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.userMessage || err.response?.data?.message || err.message || 'Sign up failed');
    }
  }
);

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
});

export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const data = await updateProfileApi(token, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.userMessage || err.response?.data?.message || err.message || 'Update failed');
    }
  }
);

export const rehydrateAuth = createAsyncThunk('auth/rehydrate', async (_, { rejectWithValue }) => {
  try {
    const [token, userJson] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(AUTH_USER_KEY),
    ]);
    if (token && userJson) {
      const user = JSON.parse(userJson);
      return { token, user };
    }
    return null;
  } catch {
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    rehydrating: true,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          _id: action.payload._id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          email: action.payload.email,
          role: action.payload.role,
          profilePic: action.payload.profilePic,
          shopName: action.payload.shopName || '',
          bio: action.payload.bio || '',
          streetNumber: action.payload.streetNumber || '',
          city: action.payload.city || '',
        };
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        AsyncStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
        AsyncStorage.setItem(
          AUTH_USER_KEY,
          JSON.stringify(state.user)
        );
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      // signUp
      .addCase(signUpAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          _id: action.payload._id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          email: action.payload.email,
          role: action.payload.role,
          profilePic: action.payload.profilePic,
          shopName: action.payload.shopName || '',
          bio: action.payload.bio || '',
          streetNumber: action.payload.streetNumber || '',
          city: action.payload.city || '',
        };
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        AsyncStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
        AsyncStorage.setItem(
          AUTH_USER_KEY,
          JSON.stringify(state.user)
        );
      })
      .addCase(signUpAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Sign up failed';
      })
      // logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // rehydrate
      .addCase(rehydrateAuth.pending, (state) => {
        state.rehydrating = true;
      })
      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        state.rehydrating = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.rehydrating = false;
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.user = {
          _id: action.payload._id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          email: action.payload.email,
          role: action.payload.role,
          profilePic: action.payload.profilePic,
          shopName: action.payload.shopName || '',
          bio: action.payload.bio || '',
          streetNumber: action.payload.streetNumber || '',
          city: action.payload.city || '',
        };
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(state.user));
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
