
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Card, Alert, Button, Badge, Modal, Form } from 'react-bootstrap';
import { FaToolbox, FaRupeeSign, FaCalendarAlt, FaTimesCircle, FaCheckCircle, FaUserCheck, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


// --- Global Helper: Status Badge ---
const getStatusBadge = (status) => {
    const variantMap = {
        'Posted': 'primary',
        'Provider Proposal': 'info',
        'Booked': 'warning',
        'Needy Accepted': 'success',
        'Provider Accepted': 'success',
        'Completed': 'dark',
        'Cancelled': 'danger',
    };
    return <Badge bg={variantMap[status] || 'secondary'} className="fs-6 p-2">{status}</Badge>;
};

// --- Review Modal Component ---
const ReviewModal = ({ show, handleClose, jobId, providerName, refreshJobs }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState({ msg: null, type: null });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return;
        setStatus({ msg: null, type: null });

        try {
            // NOTE: Ensure your backend reviews route is configured as /api/reviews
            await axios.post('/reviews', { 
                jobId,
                rating,
                comment,
            });
            
            setStatus({ msg: `Review submitted for ${providerName}!`, type: 'success' });
            
            // Close modal and refresh job list after a brief delay
            setTimeout(() => {
                handleClose();
                refreshJobs(); 
            }, 1500);

        } catch (err) {
            setStatus({ 
                msg: err.response?.data?.msg || 'Error submitting review. (Already reviewed?)', 
                type: 'danger' 
            });
        }
    };
    
    // Clear state when modal opens/closes
    useEffect(() => {
        if (show) {
            setRating(0);
            setComment('');
            setStatus({ msg: null, type: null });
        }
    }, [show]);

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title className="text-success">Rate & Review {providerName}</Modal.Title></Modal.Header>
            <Modal.Body>
                {status.msg && <Alert variant={status.type}>{status.msg}</Alert>}
                <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Rating (1-5)</Form.Label>
                        <div className="d-flex mb-3">
                            {[...Array(5)].map((_, index) => {
                                const ratingValue = index + 1;
                                return (
                                    <FaStar
                                        key={ratingValue}
                                        color={ratingValue <= rating ? "#ffc107" : "#e4e5e9"}
                                        size={30}
                                        style={{ cursor: 'pointer', marginRight: '5px' }}
                                        onClick={() => setRating(ratingValue)}
                                    />
                                );
                            })}
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Comment (Optional)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                        />
                    </Form.Group>

                    <Button variant="success" type="submit" disabled={rating === 0}>
                        Submit Review
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};




// --- Main NeedyDashboard Component ---
const NeedyDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    
    // State for Review Modal Management
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedProviderName, setSelectedProviderName] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            // GET /api/jobs/needy
            const jobsRes = await axios.get('/jobs/needy');
            const jobsWithReviewStatus = await Promise.all(jobsRes.data.map(async job => {
                if (job.status === 'Completed') {
                    // Check if review exists for completed jobs
                    const reviewRes = await axios.get(`/reviews/${job.providerId._id}`);
                    const reviewed = reviewRes.data.some(review => review.jobId === job._id);
                    return { ...job, reviewed };
                }
                return job;
            }));

            setJobs(jobsWithReviewStatus);
        } catch (err) {
            console.error(err.response || err);
            setMessage({ type: 'danger', text: 'Failed to load dashboard data.' });
        } finally {
            setLoading(false);
        }
    };

    // --- Job Action: Accept Proposal (PUT /api/jobs/:job_id/status) ---
    const handleAcceptProposal = async (jobId) => {
        setMessage(null);
        if (!window.confirm("Confirm acceptance? This will assign the Provider to the job.")) return;

        try {
            // Corrected endpoint call: PUT /jobs/:job_id/status
            await axios.put(`/jobs/${jobId}/status`, {
                newStatus: 'Needy Accepted'
            }); 
            
            setMessage({ type: 'success', text: 'Proposal accepted! The Provider has been notified.' });
            fetchJobs();
            setTimeout(() => setMessage(null), 5000);
        } catch (err) {
            console.error(err.response);
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'Failed to accept proposal. Check if job status allows acceptance.' });
        }
    };

    // --- Job Action: Cancel Job (PUT /api/jobs/:job_id/cancel) ---
    const handleCancelJob = async (jobId) => {
        setMessage(null);
        if (!window.confirm("Are you sure you want to CANCEL this job?")) return;

        try {
            // Corrected endpoint call: PUT /jobs/:job_id/status with Cancelled status
            await axios.put(`/jobs/${jobId}/status`, {
                newStatus: 'Cancelled'
            });
            setMessage({ type: 'info', text: 'Job successfully cancelled.' });
            fetchJobs(); 
            setTimeout(() => setMessage(null), 5000);
        } catch (err) {
            console.error(err.response);
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'Failed to cancel job.' });
        }
    };

    // --- Handler to open the Review Modal ---
    const handleOpenReviewModal = (job) => {
        setSelectedJobId(job._id);
        setSelectedProviderName(job.providerId?.name || 'Provider');
        setShowReviewModal(true);
    };



    // --- Job Card Component ---
    const JobItem = ({ job, handleAcceptProposal, handleCancelJob, handleOpenReviewModal }) => {

        const canAcceptProposal = job.status === 'Provider Proposal';
        const isPendingProviderAction = job.status === 'Booked';

        return (
            <Card className="mb-4 shadow-lg border-info">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Card.Title className="text-info">{job.title}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                <FaCalendarAlt className="me-1" /> Posted: {new Date(job.datePosted).toLocaleDateString()}
                            </Card.Subtitle>
                        </div>
                        {getStatusBadge(job.status)}
                    </div>
                    
                    <Card.Text className="mt-3">{job.description}</Card.Text>
                    
                    <div className="border-top pt-2 mt-3">
                        <Row className="align-items-center">
                            <Col xs={6}>
                                <div className="text-secondary">
                                    <FaRupeeSign className="me-1" /> **Budget:** ₹{job.budget}
                                </div>
                            </Col>
                            <Col xs={6} className="text-end">
                                {job.providerId ? (
                                    <div className={`text-${job.status === 'Completed' ? 'success' : 'dark'}`}>
                                        <FaUserCheck className="me-1" /> 
                                        {job.status === 'Posted' ? 'Awaiting proposal' : `Provider: ${job.providerId.name} (${job.providerId.serviceType})`}
                                    </div>
                                ) : (
                                    <div className="text-muted">Awaiting proposal...</div>
                                )}
                            </Col>
                        </Row>
                    </div>

                    <div className="mt-4 d-flex justify-content-end gap-2">
                        {/* ACCEPT/ACTION BUTTONS */}
                        {canAcceptProposal && job.providerId && (
                            <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => handleAcceptProposal(job._id)}
                            >
                                <FaCheckCircle className="me-1" /> Accept Provider
                            </Button>
                        )}

                        {/* DIRECT BOOKING FLOW: WAITING MESSAGE */}
                        {isPendingProviderAction && (
                            <span className="text-warning small">
                                Awaiting Provider Acceptance/Cancellation...
                            </span>
                        )}
                        
                        {/* REVIEW BUTTON LOGIC */}
                        {job.status === 'Completed' && job.providerId && !job.reviewed && (
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleOpenReviewModal(job)}
                            >
                                <FaStar className="me-1" /> Review Provider
                            </Button>
                        )}

                        {job.status === 'Completed' && job.reviewed && (
                            <Badge bg="success" className="p-2">Reviewed</Badge>
                        )}

                        {/* CANCEL BUTTON */}
                        {(job.status === 'Posted' || canAcceptProposal || isPendingProviderAction || job.status === 'Provider Accepted') && (
                         <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleCancelJob(job._id)}
                        >
                            <FaTimesCircle className="me-1" /> Cancel Job
                        </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="info" />
                <p>Loading Needy Dashboard...</p>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <h2 className="text-center mb-5 text-info"><FaToolbox className="me-2"/>Your Job Requests & Status</h2>
            
            {message && <Alert variant={message.type}>{message.text}</Alert>}

            {jobs.length > 0 ? (
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        {jobs.map(job => (
                            <JobItem 
                                key={job._id} 
                                job={job} 
                                // CRITICAL FIX: Pass the handlers as props
                                handleAcceptProposal={handleAcceptProposal} 
                                handleCancelJob={handleCancelJob}
                                handleOpenReviewModal={handleOpenReviewModal}
                            />
                        ))}
                    </Col>
                </Row>
            ) : (
                <Alert variant="secondary" className="text-center mt-4">
                    You have not posted any active job requests. <Button variant="link" href="/needy/post-job">Post a job now!</Button>
                </Alert>
            )}
            
            {/* --- Review Modal Attachment --- */}
            <ReviewModal 
                show={showReviewModal} 
                handleClose={() => setShowReviewModal(false)}
                jobId={selectedJobId}
                providerName={selectedProviderName}
                refreshJobs={fetchJobs}
            />
        </Container>
    );
};

export default NeedyDashboard;