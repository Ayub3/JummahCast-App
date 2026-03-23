import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Protected Route Component
 * Redirects to /login if not authenticated
 */
export function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#6b7280' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Save current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: '#6b7280' }}>You don't have permission to access this page.</p>
        <a href="/library" style={{ color: '#0b0b0c', fontWeight: 600 }}>Back to Library</a>
      </div>
    );
  }

  return children;
}
