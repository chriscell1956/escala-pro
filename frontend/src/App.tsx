import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Escalas from './pages/Escalas/Escalas';
import EscalaEspelho from './pages/Escalas/EscalaEspelho';
import Alocacao from './pages/Alocacao/Alocacao';
import Folgas from './pages/Folgas/Folgas';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TimeProvider } from './contexts/TimeContext';

const PrivateRoute = () => {
  console.log("PrivateRoute: Rendering...");
  const { isAuthenticated, loading } = useAuth();
  console.log("PrivateRoute: Auth State:", { isAuthenticated, loading });

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-main)' }}>Carregando...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default function App() {
  console.log("App: Initializing...");
  return (
    <AuthProvider>
      <TimeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/escalas" element={<Escalas />} />
                <Route path="/alocacao/:id" element={<Alocacao />} />
                <Route path="/folgas" element={<Folgas />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </TimeProvider>
    </AuthProvider>
  );
}
