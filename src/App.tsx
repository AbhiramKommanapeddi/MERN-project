import React, { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import TodoBoard from './components/TodoBoard';
import { authAPI } from './services/api';
import { User } from './types';
import { io, Socket } from 'socket.io-client';

interface AppState {
  user: User | null;
  loading: boolean;
  socket: Socket | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    user: null,
    loading: true,
    socket: null,
  });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setState(prev => ({ ...prev, user, loading: false }));
        initializeSocket(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }

    // Cleanup on unmount
    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = (token: string) => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setState(prev => ({ ...prev, socket }));
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      // Mock authentication for testing (remove when backend is ready)
      if (credentials.username === 'demo' && credentials.password === 'demo') {
        const mockUser: User = {
          _id: 'mock-user-id',
          username: 'demo',
          email: 'demo@example.com'
        };
        const mockToken = 'mock-jwt-token';
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        setState(prev => ({ ...prev, user: mockUser }));
        initializeSocket(mockToken);
        return { success: true };
      }
      
      // Real authentication (when backend is available)
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState(prev => ({ ...prev, user }));
      initializeSocket(token);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const handleRegister = async (userData: { username: string; email: string; password: string }) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState(prev => ({ ...prev, user }));
      initializeSocket(token);
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (state.socket) {
        state.socket.disconnect();
      }
      
      setState(prev => ({ ...prev, user: null, socket: null }));
    }
  };

  if (state.loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {state.user ? (
        <TodoBoard 
          user={state.user} 
          socket={state.socket} 
          onLogout={handleLogout} 
        />
      ) : (
        <AuthForm 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
        />
      )}
    </div>
  );
}

export default App;
