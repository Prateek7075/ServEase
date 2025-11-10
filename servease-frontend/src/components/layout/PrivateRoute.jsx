// servease-frontend/src/components/layout/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Container, Alert } from 'react-bootstrap';

const PrivateRoute = ({ requiredRole }) => {
    const { isAuthenticated, user } = useContext(AuthContext);

    // 1. Check Authentication
    if (!isAuthenticated) {
        // Not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // 2. Check Role (if a specific role is required)
    if (requiredRole && user.role !== requiredRole) {
        // Logged in, but wrong role, show an access denied message
        return (
            <Container className="mt-5">
                <Alert variant="danger" className="text-center">
                    **Access Denied!** You do not have permission to view this page.
                </Alert>
                <Navigate to="/" replace /> 
            </Container>
        );
    }

    // 3. User is authorized, render the child component
    return <Outlet />;
};

export default PrivateRoute;