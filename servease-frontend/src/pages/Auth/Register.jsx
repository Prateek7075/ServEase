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
        role: 'Needy',
        serviceType: '',
        location: '',
        mobileNumber: '',
    });

    const { register, isAuthenticated, user } = useContext(AuthContext);
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
        const dataToSend = formData.role === 'Needy'
            ? { name: formData.name, email: formData.email, password: formData.password, role: formData.role }
            : formData;
        await register(dataToSend);
    };

    return (
        <Container
            fluid
            className="d-flex justify-content-center align-items-center"
            style={{
                minHeight: '80vh',
                background: 'linear-gradient(135deg, #f7f8fc 0%, #e9effd 100%)',
                padding: '40px 0',
            }}
        >
            <Row className="w-100 justify-content-center">
                <Col xs={11} sm={10} md={7} lg={5}>
                    <Card
                        className="p-4 border-0 shadow-sm"
                        style={{
                            borderRadius: '16px',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <h3 className="text-center mb-3" style={{ color: '#198754', fontWeight: '600' }}>
                            Create Your Account
                        </h3>
                        <p className="text-center text-muted mb-4">
                            Join <strong>Servease</strong> and connect with your community
                        </p>

                        <Form onSubmit={onSubmit}>
                            {/* Role Selection */}
                            <Form.Group className="mb-4 text-center">
                                <Form.Label className="fw-semibold mb-2">Registering as:</Form.Label>
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

                            {/* Common Fields */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500' }}>Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter your full name"
                                    name="name"
                                    value={formData.name}
                                    onChange={onChange}
                                    required
                                    style={{
                                        borderRadius: '10px',
                                        border: '1px solid #d1d5db',
                                        padding: '10px 12px',
                                    }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500' }}>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={formData.email}
                                    onChange={onChange}
                                    required
                                    style={{
                                        borderRadius: '10px',
                                        border: '1px solid #d1d5db',
                                        padding: '10px 12px',
                                    }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '500' }}>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Password (min 6 chars)"
                                    name="password"
                                    value={formData.password}
                                    onChange={onChange}
                                    minLength="6"
                                    required
                                    style={{
                                        borderRadius: '10px',
                                        border: '1px solid #d1d5db',
                                        padding: '10px 12px',
                                    }}
                                />
                            </Form.Group>

                            {/* Provider-specific section */}
                            {formData.role === 'Provider' && (
                                <Card
                                    className="p-3 mb-3 border-0 shadow-sm"
                                    style={{
                                        backgroundColor: '#f9f9ff',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <h6
                                        className="fw-semibold mb-3"
                                        style={{ color: '#ffc107', textAlign: 'center' }}
                                    >
                                        Provider Details
                                    </h6>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Service Type</Form.Label>
                                        <Form.Select
                                            name="serviceType"
                                            value={formData.serviceType}
                                            onChange={onChange}
                                            required
                                            style={{ borderRadius: '10px' }}
                                        >
                                            <option value="">Select a service...</option>
                                            <option value="Plumber">Plumber</option>
                                            <option value="Electrician">Electrician</option>
                                            <option value="Carpenter">Carpenter</option>
                                            <option value="Painter">Painter</option>
                                            <option value="Other">Other</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Location (City / Area)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g., Bandra, Mumbai"
                                            name="location"
                                            value={formData.location}
                                            onChange={onChange}
                                            required
                                            style={{
                                                borderRadius: '10px',
                                                border: '1px solid #d1d5db',
                                                padding: '10px 12px',
                                            }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-2">
                                        <Form.Label>Mobile Number</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            placeholder="Enter mobile number"
                                            name="mobileNumber"
                                            value={formData.mobileNumber}
                                            onChange={onChange}
                                            style={{
                                                borderRadius: '10px',
                                                border: '1px solid #d1d5db',
                                                padding: '10px 12px',
                                            }}
                                        />
                                    </Form.Group>
                                </Card>
                            )}

                            <div className="d-grid mt-4">
                                <Button
                                    variant="success"
                                    type="submit"
                                    size="lg"
                                    style={{
                                        borderRadius: '10px',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        transition: '0.3s ease',
                                    }}
                                >
                                    Register Account
                                </Button>
                            </div>
                        </Form>

                        <p className="mt-4 text-center text-muted">
                            Already have an account?{' '}
                            <a
                                href="/login"
                                style={{
                                    color: '#198754',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                }}
                            >
                                Login here
                            </a>
                        </p>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
