// servease-frontend/src/pages/Auth/Register.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Needy', // Default role
        serviceType: '',
        location: '',
        mobileNumber: '',
    });

    const { register, isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect logic
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
        
        // Remove provider fields if the user registers as Needy
        const dataToSend = formData.role === 'Needy' 
            ? { name: formData.name, email: formData.email, password: formData.password, role: formData.role }
            : formData;

        await register(dataToSend);
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="p-4 shadow-lg border-success">
                        <h2 className="text-center mb-4 text-success">Register for Servease</h2>
                        <Form onSubmit={onSubmit}>
                            
                            {/* Role Selector */}
                            <Form.Group className="mb-3">
                                <Form.Label>Registering as:</Form.Label>
                                <div>
                                    <Form.Check
                                        inline
                                        type="radio"
                                        label="The Needy"
                                        name="role"
                                        value="Needy"
                                        checked={formData.role === 'Needy'}
                                        onChange={onChange}
                                        id="radioNeedy"
                                    />
                                    <Form.Check
                                        inline
                                        type="radio"
                                        label="Service Provider"
                                        name="role"
                                        value="Provider"
                                        checked={formData.role === 'Provider'}
                                        onChange={onChange}
                                        id="radioProvider"
                                    />
                                </div>
                            </Form.Group>

                            {/* Shared Fields */}
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control type="text" placeholder="Enter your name" name="name" value={formData.name} onChange={onChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Email address</Form.Label>
                                <Form.Control type="email" placeholder="Enter email" name="email" value={formData.email} onChange={onChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" placeholder="Password (min 6 chars)" name="password" value={formData.password} onChange={onChange} minLength="6" required />
                            </Form.Group>
                            
                            {/* Provider Specific Fields (Conditional Rendering) */}
                            {formData.role === 'Provider' && (
                                <Card className="p-3 mb-3 border-warning">
                                    <h5 className="text-warning">Provider Details:</h5>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Service Type</Form.Label>
                                        <Form.Select name="serviceType" value={formData.serviceType} onChange={onChange} required>
                                            <option value="">Select Service...</option>
                                            <option value="Plumber">Plumber</option>
                                            <option value="Electrician">Electrician</option>
                                            <option value="Carpenter">Carpenter</option>
                                            <option value="Painter">Painter</option>
                                            <option value="Other">Other</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Location (City/Area)</Form.Label>
                                        <Form.Control type="text" placeholder="e.g., Downtown, Mumbai" name="location" value={formData.location} onChange={onChange} required />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mobile Number</Form.Label>
                                        <Form.Control type="tel" placeholder="Mobile number" name="mobileNumber" value={formData.mobileNumber} onChange={onChange} />
                                    </Form.Group>
                                </Card>
                            )}

                            <div className="d-grid gap-2 mt-4">
                                <Button variant="success" type="submit" size="lg">
                                    Register Account
                                </Button>
                            </div>
                        </Form>
                        <p className="mt-3 text-center">
                            Already have an account? <a href="/login">Login here</a>
                        </p>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;