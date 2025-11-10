// servease-frontend/src/pages/Auth/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;
    const { login, isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect logic: If already authenticated, redirect to the appropriate home page
    useEffect(() => {
        if (isAuthenticated) {
            if (user.role === 'Needy') {
                navigate('/needy/home');
            } else if (user.role === 'Provider') {
                navigate('/provider/home');
            }
        }
    }, [isAuthenticated, user, navigate]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        const success = await login({ email, password });
        // The useEffect hook handles navigation upon successful login
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Card style={{ width: '25rem' }} className="p-4 shadow">
                <h2 className="text-center mb-4 text-primary">User Login</h2>
                <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control 
                            type="email" 
                            placeholder="Enter email" 
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            placeholder="Password" 
                            name="password"
                            value={password}
                            onChange={onChange}
                            minLength="6"
                            required
                        />
                    </Form.Group>
                    
                    <div className="d-grid gap-2">
                        <Button variant="primary" type="submit" size="lg">
                            Login
                        </Button>
                    </div>
                </Form>
                <p className="mt-3 text-center">
                    Don't have an account? <a href="/register">Register here</a>
                </p>
            </Card>
        </Container>
    );
};

export default Login;