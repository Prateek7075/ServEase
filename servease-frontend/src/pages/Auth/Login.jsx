// servease-frontend/src/pages/Auth/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
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

    useEffect(() => {
        if (isAuthenticated) {
            if (user.role === 'Needy') navigate('/needy/home');
            else if (user.role === 'Provider') navigate('/provider/home');
        }
    }, [isAuthenticated, user, navigate]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        await login({ email, password });
    };

    return (
        <Container
            fluid
            className="d-flex justify-content-center align-items-center"
            style={{
                minHeight: '90vh',
                background: 'linear-gradient(135deg, #f7f8fc 0%, #e9effd 100%)',
            }}
        >
            <Row className="w-100 justify-content-center">
                <Col xs={11} sm={8} md={6} lg={4}>
                    <Card
                        className="p-4 border-0 shadow-sm"
                        style={{
                            borderRadius: '16px',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <h3 className="text-center mb-3" style={{ color: '#198754', fontWeight: '600' }}>
                            Welcome Back
                        </h3>
                        <p className="text-center text-muted mb-4">
                            Please sign in to continue
                        </p>

                        <Form onSubmit={onSubmit}>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label style={{ fontWeight: '500' }}>Email address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    required
                                    style={{
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                    }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label style={{ fontWeight: '500' }}>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter your password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    minLength="6"
                                    required
                                    style={{
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                    }}
                                />
                            </Form.Group>

                            <div className="d-grid gap-2 mt-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    size="lg"
                                    style={{
                                        borderRadius: '10px',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        transition: '0.3s ease',
                                        backgroundColor: '#198754',         
                                    }}
                                >
                                    Sign In
                                </Button>
                            </div>
                        </Form>

                        <p className="mt-4 text-center text-muted">
                            Don't have an account?{' '}
                            <a
                                href="/register"
                                style={{
                                    color: '#198754',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                }}
                            >
                                Register here
                            </a>
                        </p>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
