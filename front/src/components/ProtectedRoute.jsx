import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-screen">
        <div style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Carregando sessão…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
