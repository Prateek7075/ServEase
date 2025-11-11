import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom'; 
// REMOVE Spinner import to avoid crash
import { AuthContext } from './context/AuthContext'; 

// === CORE COMPONENTS & PAGES ===
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/layout/PrivateRoute'; 
import Home from './pages/Home';
import Register from './pages/Auth/Register'; 
import Login from './pages/Auth/Login'; 
import NeedyHome from './pages/Needy/NeedyHome'; 
import NeedyDashboard from './pages/Needy/NeedyDashboard';
import PostJob from './pages/Needy/PostJob';
import ProviderHome from './pages/Provider/ProviderHome'; 
import ProviderDashboard from './pages/Provider/ProviderDashboard';

function App() {
    const { loading } = useContext(AuthContext); 

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '20vh', color: '#007bff' }}>
                <h1>Loading Servease...</h1>
                <div style={{ 
                    border: '5px solid #f3f3f3', 
                    borderTop: '5px solid #007bff', 
                    borderRadius: '50%', 
                    width: '30px', 
                    height: '30px', 
                    animation: 'spin 1s linear infinite',
                    margin: '20px auto'
                }}></div>
                <p>Verifying session. If stuck here, check the backend server!</p>
            </div>
        );
    }

    return (
        <> 
            <Navbar />
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* === NEEDY PROTECTED ROUTES === */}
                <Route element={<PrivateRoute requiredRole="Needy" />}>
                    <Route path="/needy/home" element={<NeedyHome />} />
                    <Route path="/needy/post-job" element={<PostJob />} />
                    <Route path="/needy/dashboard" element={<NeedyDashboard />} />
                </Route>

                {/* === PROVIDER PROTECTED ROUTES === */}
                <Route element={<PrivateRoute requiredRole="Provider" />}>
                    <Route path="/provider/home" element={<ProviderHome />} />
                    <Route path="/provider/dashboard" element={<ProviderDashboard />} /> 
                </Route>
            </Routes>
        </>
    );
}

export default App;