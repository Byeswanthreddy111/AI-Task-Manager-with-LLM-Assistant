import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Components (keep these - small and needed immediately)
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Loading from './components/Loading';

// Lazy load pages (load only when needed)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}

        <Suspense fallback={<Loading fullScreen={true} message="Loading..." />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/register"
              element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />}
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <PrivateRoute>
                  <AIChat />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* Default route */}
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;