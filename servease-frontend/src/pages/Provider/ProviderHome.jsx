// servease-frontend/src/pages/Provider/ProviderHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Card, Alert, Button, Badge } from 'react-bootstrap';
import { FaToolbox, FaMapMarkerAlt, FaRupeeSign, FaCalendarAlt } from 'react-icons/fa'; // Icons for visual appeal

const ProviderHome = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            // This endpoint fetches jobs matching the Provider's serviceType and status 'Posted'
            const res = await axios.get('/providers/jobs'); 
            setJobs(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.msg || 'Failed to fetch jobs.';
            setError(msg);
            setLoading(false);
        }
    };
    
    // --- Job Action: Send Proposal ---
    // This connects to the backend PUT /api/jobs/:job_id/respond (Step 12)
    const handleSendProposal = async (jobId) => {
        // Optional: Add a confirmation dialog here if you haven't already
        if (!window.confirm("Confirm sending proposal for this job?")) return;
        try {
            // Note: Sending an empty body for a PUT request usually works for status updates
            await axios.put(`/jobs/${jobId}/respond`, { 
                action: 'Proposal' // <-- Correct payload format
            }); 
            
            setStatusMessage({ 
                type: 'success', 
                text: 'Proposal sent successfully! Awaiting Needy acceptance.' 
            });
            
            // Re-fetch the jobs list to remove the job just responded to
            fetchJobs(); 
            
            setTimeout(() => setStatusMessage(null), 500);

        } catch (err) {
            console.error(err.response);
            setStatusMessage({ 
                type: 'danger', 
                text: err.response?.data?.msg || 'Failed to send proposal.' 
            });
        }
    };

    // --- Loading and Error States ---
    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="warning" />
                <p>Loading matching job requests...</p>
            </Container>
        );
    }

    // --- Job Card Component ---
    const JobCard = ({ job }) => (
        <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow border-warning">
                <Card.Body>
                    <Badge bg="secondary" className="mb-2">{job.requiredServiceType}</Badge>
                    <Card.Title className="text-dark">{job.title}</Card.Title>
                    
                    <Card.Text className="text-muted small">
                        <FaCalendarAlt className="me-1" /> Posted: {new Date(job.datePosted).toLocaleDateString()}
                    </Card.Text>
                    
                    <Card.Text className="text-truncate" style={{ maxHeight: '4.5em' }}><span>Description</span> <br />
                        {job.description}
                    </Card.Text>
                    
                    <hr/>

                    <Card.Text className="lead text-danger"> 
                        <span>Budget:</span> ₹{job.budget}
                    </Card.Text>
                    
                    <Card.Text>
                        <FaMapMarkerAlt className="me-2 text-warning" />
                        <span>Location: </span> {job.location}
                    </Card.Text>

                    <Button 
                        variant="warning" 
                        className="w-100 mt-3"
                        onClick={() => handleSendProposal(job._id)}
                    >
                        Click to Send Proposal
                    </Button>
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <Container className="py-5">
            <h2 className="text-center mb-5 text-warning">Available Jobs Matching Your Service</h2>
            
            {statusMessage && <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {jobs.length > 0 ? (
                <Row>
                    {jobs.map(job => (
                        <JobCard key={job._id} job={job} />
                    ))}
                </Row>
            ) : (
                <Alert variant="info" className="text-center mt-4">
                    Great job! <br /> No new job posts match your service type currently, or you have already responded to all of them. Check your Dashboard for active bookings.
                </Alert>
            )}
        </Container>
    );
};

export default ProviderHome;