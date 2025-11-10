// servease-frontend/src/components/layout/Navbar.jsx (Revised)

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { FaUserCircle, FaListAlt, FaSignOutAlt, FaHome} from 'react-icons/fa'; // Added new icons
import '../../assets/styles/navbar.css';
import brandlogo from '../../assets/images/brand-logo.png'; 



const Navbar = () => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // --- Dynamic Links for Authenticated Users ---
    const authLinks = (
        <>
            {user && user.role === 'Needy' && (
                <>
                    {/* Link to NEEDY's main job search page */}
                    <Nav.Link as={Link} to="/needy/home">
                        <FaListAlt className="me-1" /> Available Providers
                    </Nav.Link>
                    {/* Link to NEEDY Dashboard (My Posted Jobs) */}
                    <Nav.Link as={Link} to="/needy/dashboard">
                        <FaUserCircle className="me-1" /> My Dashboard
                    </Nav.Link>
                </>
            )}
            {user && user.role === 'Provider' && (
                <>
                    {/* Link to PROVIDER's job list page */}
                    <Nav.Link as={Link} to="/provider/home">
                        <FaListAlt className="me-1" /> Available Jobs
                    </Nav.Link>
                    {/* Link to PROVIDER Dashboard (Profile & Active Jobs) */}
                    <Nav.Link as={Link} to="/provider/dashboard">
                        <FaUserCircle className="me-1" /> My Dashboard
                    </Nav.Link>
                </>
            )}

            <Button 
                variant="outline-light" 
                className="ms-3" 
                onClick={handleLogout}
            >
                <FaSignOutAlt className="me-1" /> Logout
            </Button>
        </>
    );

    // --- Links for Guests (Unauthenticated Users) ---
    const guestLinks = (
        <>
            <Nav.Link as={Link} to="/register">Register</Nav.Link>
            <Nav.Link as={Link} to="/login" className="login-button">Login</Nav.Link>
        </>
    );

    return (
        <BsNavbar className="mb-4 shadow-sm navbar servease-navbar" expand="md">
    <Container>
        <BsNavbar.Brand as={Link} to="/" className="servease-brand">
            <img src={brandlogo} alt="" className="servease-logo"/> serv<span className='second-half-logo'>ease</span> 
        </BsNavbar.Brand>

     
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BsNavbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto login-register-links">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                {isAuthenticated ? authLinks : guestLinks}
            </Nav>
        </BsNavbar.Collapse>
    </Container>
</BsNavbar>

    );
};

export default Navbar;