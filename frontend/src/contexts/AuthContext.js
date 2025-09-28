import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  useEffect(() => {
    const loadUser = async () => {
      console.log('loadUser called, token:', state.token);
      if (state.token) {
        try {
          console.log('Making request to /api/auth/me');
          const response = await axios.get('http://localhost:5000/api/auth/me');
          console.log('User data response:', response.data);
          dispatch({ type: 'LOAD_USER', payload: response.data.data.user });
        } catch (error) {
          console.error('Load user error:', error);
          console.error('Error response:', error.response?.data);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('No token, setting user to null');
        // To prevent screen flicker, we should dispatch something to indicate loading is finished
        dispatch({ type: 'LOAD_USER', payload: null });
      }
    };

    loadUser();
  }, [state.token]);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      const { user, token, role } = res.data.data;
      console.log('Login response data:', { user, token, role });

      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      const decoded = jwt_decode(token);
      console.log('Decoded token:', decoded);
      console.log('Role from response:', role);
      console.log('Role from token:', decoded.role);

      if (role === 'client' || decoded.role === 'client') {
        console.log('Navigating to client dashboard');
        navigate('/client-dashboard');
      } else if (role === 'supplier' || decoded.role === 'supplier') {
        console.log('Navigating to supplier dashboard');
        navigate('/supplier-dashboard');
      } else {
        console.log('Unknown role, navigating to home');
        navigate('/');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Email ou mot de passe incorrect';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'REGISTER_START' });
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response.data.data });
      navigate('/login');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  const setUser = (userData) => {
    dispatch({ type: 'SET_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    setUser,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
