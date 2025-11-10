// servease-frontend/src/pages/Needy/NeedyHome.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { FaUserCircle, FaMapMarkerAlt, FaToolbox, FaRupeeSign, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// --- 1. Booking Modal Component ---
const BookingModal = ({ show, handleClose, provider, fetchProviders }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: provider?.hourlyRate * 4 || 500, // Default suggested budget
        location: provider?.location || '',
        providerId: provider?._id || '',
    });
    const [bookingMessage, setBookingMessage] = useState(null);
    const navigate = useNavigate();

    // Reset form data when provider changes or modal opens
    useEffect(() => {
        if (provider) {
            setFormData({
                title: '',
                description: '',
                budget: provider.hourlyRate * 4 || 500,
                location: provider.location || '',
                providerId: provider._id,
            });
            setBookingMessage(null);
        }
    }, [provider]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setBookingMessage(null);

        try {
            // POST /api/jobs/book endpoint
            await axios.post('/jobs/book', formData); 
            
            setBookingMessage({
                type: 'success',
                text: `Successfully sent booking request to ${provider.name}. Redirecting to dashboard...`
            });
            
            // Redirect after a brief delay
            setTimeout(() => {
                handleClose();
                fetchProviders(); // Refresh provider list if status changes are tracked
                navigate('/needy/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Booking Error:', err.response?.data?.msg || err);
            setBookingMessage({
                type: 'danger',
                text: err.response?.data?.msg || 'Failed to submit direct booking.'
            });
        }
    };

    if (!provider) return null;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-success">Direct Booking: {provider.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {bookingMessage && <Alert variant={bookingMessage.type}>{bookingMessage.text}</Alert>}

                <p className="text-muted small">
                    **Rate:** ₹{provider.hourlyRate} / hour
                </p>

                <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Job Title</Form.Label>
                        <Form.Control type="text" name="title" value={formData.title} onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Detailed Description</Form.Label>
                        <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Total Budget/Price (₹)</Form.Label>
                        <Form.Control type="number" name="budget" value={formData.budget} onChange={onChange} min="1" required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Work Location</Form.Label>
                        <Form.Control type="text" name="location" value={formData.location} onChange={onChange} required />
                    </Form.Group>
                    
                    <div className="d-grid mt-4">
                        <Button variant="success" type="submit">
                            Confirm Direct Booking
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};


// --- 2. Provider Card Component ---
const ProviderCard = ({ provider, handleOpenModal }) => (
    <Col md={6} lg={4} className="mb-4">
        <Card className="h-100 shadow-lg border-primary">
            <Card.Body>
                
                <div className="text-center mb-3">
                    <FaUserCircle size={40} className="text-primary" />
                    <Card.Title className="mt-2 text-primary">
                        {provider.name}     
                    </Card.Title>
                </div>
                
                <Card.Text>
                    <FaMapMarkerAlt className="me-2 text-secondary" />
                    Location: {provider.location || 'N/A'}
                </Card.Text>
                
                <Card.Text className="lead text-success">
                    Rate: <FaRupeeSign className="me-1" />{provider.hourlyRate} / hour 
                </Card.Text>

                <Card.Text className="text-warning my-2">
                    <FaStar className="me-2" />
                    Rating: {provider.averageRating?.toFixed(1) || 'No Rating'} 
                    <span className="text-muted small"> ({provider.totalReviews} reviews)</span>
                </Card.Text>
                
                <hr/>
                
                <Card.Text>
                    <FaToolbox className="me-2 text-info" />
                    Service: {provider.serviceType}
                </Card.Text>
                
                {/* --- Direct Booking Button --- */}
                <Button 
                    variant="success" 
                    size="sm" 
                    className="w-100 mt-3"
                    onClick={() => handleOpenModal(provider)} 
                >
                    Book Provider
                </Button>
            </Card.Body>
        </Card>
    </Col>
);


// --- 3. Main NeedyHome Component ---
const NeedyHome = () => {
    const [providers, setProviders] = useState([]);
    const [filteredProviders, setFilteredProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    
    // State for Modal and Selected Provider
    const [showModal, setShowModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null); 
    
    const serviceTypes = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Other'];

    const fetchProviders = async () => {
        try {
            const res = await axios.get('/providers/available'); 
            setProviders(res.data);
            setFilteredProviders(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch service providers.');
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchProviders();
    }, []);

    // --- Modal Handlers ---
    const handleOpenModal = (provider) => {
        setSelectedProvider(provider);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProvider(null);
    };


    // --- Filtering Logic ---
    useEffect(() => {
        let results = providers;

        if (serviceFilter) {
            results = results.filter(p => p.serviceType === serviceFilter);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            results = results.filter(
                p => 
                    p.name.toLowerCase().includes(lowerCaseSearch) || 
                    p.location.toLowerCase().includes(lowerCaseSearch)
            );
        }

        setFilteredProviders(results);
    }, [searchTerm, serviceFilter, providers]);


    // --- Loading and Error States ---
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p>Loading available providers...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }
    

    return (
        <Container className="py-5">
            <h2 className="text-center mb-4 text-primary">Browse Available Service Providers</h2>

            {/* --- Search & Filter Bar --- */}
            <Row className="mb-4 bg-light p-3 rounded shadow-sm">
                <Col md={8}>
                    <Form.Control
                        type="text"
                        placeholder="Search by name or location..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Select
                        value={serviceFilter}
                        onChange={e => setServiceFilter(e.target.value)}
                    >
                        <option value="">All Services</option>
                        {serviceTypes.map(service => (
                            <option key={service} value={service}>
                                {service}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>
            
            <div className="d-flex justify-content-end mb-4">
                <Button variant="info" href="/needy/post-job">
                    Post a Job Publicly
                </Button>
            </div>


            {/* --- Providers Grid --- */}
            {filteredProviders.length > 0 ? (
                <Row>
                    {filteredProviders.map(provider => (
                        <ProviderCard 
                            key={provider._id} 
                            provider={provider} 
                            handleOpenModal={handleOpenModal} // Handler passed here
                        />
                    ))}
                </Row>
            ) : (
                <Alert variant="warning" className="text-center mt-4">
                    No service providers match your criteria or are currently open for jobs.
                </Alert>
            )}
            
            {/* --- ATTACH THE DIRECT BOOKING MODAL --- */}
            <BookingModal 
                show={showModal} 
                handleClose={handleCloseModal} 
                provider={selectedProvider}
                fetchProviders={fetchProviders} // Pass fetch function to refresh the list
            />
        </Container>
    );
};

export default NeedyHome;