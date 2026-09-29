import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Today from './pages/Today.jsx';
import Execution from './pages/Execution.jsx';
import Progress from './pages/Progress.jsx';

function Gate({ children, requireGoals = true }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (requireGoals && (!user.goals || user.goals.length === 0)) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function FullScreenLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
      loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/onboarding"
            element={
              <Gate requireGoals={false}>
                <Onboarding />
              </Gate>
            }
          />
          <Route
            path="/"
            element={
              <Gate>
                <Today />
              </Gate>
            }
          />
          <Route
            path="/missions/:id"
            element={
              <Gate>
                <Execution />
              </Gate>
            }
          />
          <Route
            path="/progress"
            element={
              <Gate>
                <Progress />
              </Gate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
