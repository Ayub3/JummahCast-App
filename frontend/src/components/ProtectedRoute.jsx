import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
export function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login, save current location
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    // User doesn't have required role
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
}
