import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard/Dashboard';
import Escalas from './pages/Escalas/Escalas';
// import Alocacao from './pages/Alocacao/Alocacao';
import Folgas from './pages/Folgas/Folgas';
import { AuthProvider } from './contexts/AuthContext';

function App() {
    console.log('App component rendering');
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/escalas" replace />} />
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/escalas" element={<Escalas />} />
                        {/* <Route path="/alocacao/:id" element={<Alocacao />} /> */}
                        <Route path="/folgas" element={<Folgas />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
