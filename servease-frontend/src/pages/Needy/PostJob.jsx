// servease-frontend/src/pages/Needy/PostJob.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const PostJob = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        location: '',
        requiredServiceType: '',
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const serviceTypes = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Other'];

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        // Simple validation check
        if (!formData.requiredServiceType || !formData.budget || formData.budget <= 0) {
            setError('Please fill all required fields correctly.');
            return;
        }

        try {
            // Note: Axios automatically sends the x-auth-token from AuthContext defaults
            const res = await axios.post('/jobs/post', formData); 
            
            setMessage(`Job "${res.data.title}" posted successfully! Providers can now see it.`);
            
            // Clear form and navigate after a brief moment
            setFormData({ title: '', description: '', budget: '', location: '', requiredServiceType: '' });
            setTimeout(() => {
                navigate('/needy/dashboard'); // Send user to dashboard to track the job
            }, 3000);

        } catch (err) {
            console.error('Job Posting Error:', err.response.data);
            const errMsg = err.response.data.errors ? err.response.data.errors[0].msg : 'An error occurred during posting.';
            setError(errMsg);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={7}>
                    <Card className="p-4 shadow-lg border-info">
                        <h2 className="text-center mb-4 text-info">Post a New Service Request</h2>
                        
                        {message && <Alert variant="success">{message}</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form onSubmit={onSubmit}>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Job Title</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="e.g., Leaky Kitchen Faucet Repair" 
                                    name="title" 
                                    value={formData.title} 
                                    onChange={onChange} 
                                    required 
                                />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Detailed Description</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3} 
                                    placeholder="Describe the issue, required tools, and access details." 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={onChange} 
                                    required 
                                />
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Required Service Type</Form.Label>
                                        <Form.Select 
                                            name="requiredServiceType" 
                                            value={formData.requiredServiceType} 
                                            onChange={onChange} 
                                            required
                                        >
                                            <option value="">Select Service...</option>
                                            {serviceTypes.map(service => (
                                                <option key={service} value={service}>
                                                    {service}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Your Budget (in ₹)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            placeholder="e.g., 500" 
                                            name="budget" 
                                            value={formData.budget} 
                                            onChange={onChange} 
                                            min="1"
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            
                            <Form.Group className="mb-4">
                                <Form.Label>Location of Work</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="e.g., Sector 10, City Name" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={onChange} 
                                    required 
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button variant="info" type="submit" size="lg">
                                    Submit Job Post
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default PostJob;