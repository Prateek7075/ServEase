// servease-frontend/src/pages/Provider/ProviderDashboard.jsx (FINAL CORRECT VERSION)
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Card, Form, Button, Alert, Badge, Nav } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { FaMapMarkerAlt, FaToolbox, FaRupeeSign, FaCheckCircle, FaToggleOn, FaToggleOff, FaStar, FaTimesCircle } from 'react-icons/fa';


// --- JobItem Component (Nested for Dashboard use) ---
const JobItem = ({ job, handleCompleteJob, handleJobResponse }) => {
    const statusVariant = {
        'Provider Proposal': 'info',
        'Booked': 'warning', // Pending direct acceptance/rejection
        'Provider Accepted': 'success', // Confirmed to start work
        'Needy Accepted': 'success', // Confirmed to start work
        'Completed': 'dark',
        'Cancelled': 'danger',
    };
    
    return (
        <Card className="mb-3 shadow-sm border-secondary">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <Card.Title>{job.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                            <FaMapMarkerAlt className="me-1" /> {job.location} | <FaRupeeSign className="me-1" /> {job.budget}
                        </Card.Subtitle>
                    </div>
                    <Badge bg={statusVariant[job.status] || 'secondary'} className="fs-6 p-2">
                        {job.status}
                    </Badge>
                </div>
                
                <Card.Text className="mt-3">{job.description}</Card.Text>
                
                <div className="border-top pt-2 mt-3">
                    <small className="d-block">
                        **Needy Contact:** {job.needyId.name} ({job.needyId.mobileNumber || 'N/A'})
                    </small>
                </div>

                {/* --- CONDITIONAL ACTION BUTTONS --- */}
                <div className="mt-3 d-flex justify-content-end gap-2">
                    
                    {/* 1. DIRECT BOOKING ACTION (Accept/Cancel for 'Booked' status) */}
                    {job.status === 'Booked' && (
                        <>
                            <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => handleJobResponse(job._id, 'Accept')} 
                            >
                                <FaCheckCircle className="me-1" /> Accept Booking
                            </Button>
                            <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleJobResponse(job._id, 'Cancel')} 
                            >
                                <FaTimesCircle className="me-1" /> Cancel Booking
                            </Button>
                        </>
                    )}

                    {/* 2. PROPOSAL STATUS (Awaiting Needy decision) */}
                    {job.status === 'Provider Proposal' && (
                        <span className="text-info small">Awaiting Needy Acceptance...</span>
                    )}

                    {/* 3. MARK COMPLETED ACTION (For 'Accepted' statuses) */}
                    {(job.status === 'Provider Accepted' || job.status === 'Needy Accepted') && (
                        <Button 
                            variant="warning" 
                            size="sm" 
                            onClick={() => handleCompleteJob(job._id)}
                        >
                            <FaCheckCircle className="me-1" /> Mark as Completed
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};


// --- Main ProviderDashboard Component ---
const ProviderDashboard = () => {
    const { user: authUser } = useContext(AuthContext); 
    const [profile, setProfile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('management'); // 'management' or 'history'

    // --- Data Fetching ---
    useEffect(() => {
        if (authUser) {
            fetchProfileAndJobs();
        }
    }, [authUser]);

    const fetchProfileAndJobs = async () => {
        setLoading(true);
        try {
            const profileRes = await axios.get('/users/me'); 
            setProfile(profileRes.data);
            
            const jobsRes = await axios.get('/jobs/provider');
            setJobs(jobsRes.data);

            // NEW: Fetch Analytics Data
            const analyticsRes = await axios.get('/providers/analytics/me');
            setAnalytics(analyticsRes.data);

        } catch (err) {
            console.error(err.response || err);
            setMessage({ type: 'danger', text: 'Failed to load dashboard data.' });
        } finally {
            setLoading(false);
        }
    };

    // --- Profile Update Logic ---
    const handleProfileChange = e => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setProfile({ ...profile, [e.target.name]: value });
    };

    const handleProfileSubmit = async e => {
        e.preventDefault();
        setMessage(null);
        try {
            const dataToUpdate = {
                hourlyRate: profile.hourlyRate,
                location: profile.location,
                isOpenForJobs: profile.isOpenForJobs,
            };
            await axios.put('/providers/profile', dataToUpdate);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error(err.response);
            setMessage({ type: 'danger', text: 'Failed to update profile.' });
        }
    };

    // --- 1. JOB COMPLETION HANDLER ---
    const handleCompleteJob = async (jobId) => {
        setMessage(null);
        if (!window.confirm("Are you sure you want to mark this job as COMPLETED? This action is permanent.")) return;

        try {
            await axios.put(`/jobs/${jobId}/complete`);
            setMessage({ type: 'success', text: 'Job marked as completed! Good work!' });
            fetchProfileAndJobs(); // Refresh job list
        } catch (err) {
            console.error(err.response);
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'Failed to mark job as complete.' });
        }
    };
    
    // --- 2. ACCEPT/CANCEL BOOKING HANDLER ---
    const handleJobResponse = async (jobId, action) => {
        setMessage(null);
        if (!window.confirm(`Are you sure you want to ${action} this booking?`)) return;
        
        try {
            // PUT /jobs/:job_id/respond expects the action in the body
            const res = await axios.put(`/jobs/${jobId}/respond`, { action:action }); 
            
            const actionText = action === 'Accept' ? 'Accepted' : 'Cancelled';

            setMessage({ 
                type: action === 'Accept' ? 'success' : 'warning', 
                text: `Booking successfully ${actionText}. The Needy user has been notified.` 
            });
            fetchProfileAndJobs(); // Refresh job list

        } catch (err) {
            setMessage({ 
                type: 'danger', 
                text: err.response?.data?.msg || 'Failed to update job status.' 
            });
        }
    };

    // --- 3 Analytics View Component ---
    const AnalyticsView = ({analytics}) => {
        if (!analytics) return <Spinner animation="border" variant="secondary" />;

        // Safely assign default values if aggregation returned no results
        const totalEarning = analytics.totalEarning || 0;
        const completedJobsCount = analytics.completedJobsCount || 0;
        const jobHistory = analytics.jobHistory || [];
        const reviews = analytics.reviews || [];

        return (
            <>
                {/* Analytics Summary */}
                <Card className="mb-4 shadow-sm border-success">
                    <Card.Header className="text-success"><h3>📊 Earnings & Performance</h3></Card.Header>
                    <Card.Body>
                        <Row className="text-center">
                            <Col>
                                {/* FIX: Use safe variable with .toFixed() */}
                                <h4>₹{totalEarning.toFixed(2)}</h4>
                                <p className="text-muted">Total Earnings</p>
                            </Col>
                            <Col>
                                <h4>{completedJobsCount}</h4> 
                                <p className="text-muted">Jobs Completed</p>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Job History */}
                <h4 className="mt-4 mb-3 text-secondary">Job History ({jobHistory.length})</h4>
                {jobHistory.length > 0 ? (
                    jobHistory.map(job => (
                    <Card key={job._id} className="mb-2 p-3">
                        <Row>
                            <Col md={8}>**{job.title}**</Col>
                            <Col md={4} className="text-end text-success">
                                {/* FIX: Ensure job.budget is treated as a number */}
                                ₹{parseFloat(job.budget).toFixed(2)} on {new Date(job.datePosted).toLocaleDateString()}
                            </Col>
                        </Row>
                    </Card>
                ))): (
                <Alert variant="secondary">No completed job history found.</Alert>
                )}

                {/* Reviews List */}
                <h4 className="mt-4 mb-3 text-secondary">All Reviews ({reviews.length})</h4>
                {reviews.length > 0 ? (
                reviews.map(review => (
                    <Card key={review._id} className="mb-3 p-3 border-info">
                        <p className="mb-1">
                            {/* FaStar is assumed to be imported */}
                            <FaStar color="#ffc107" /> **Rating:** {review.rating} / 5
                        </p>
                        <p className="mb-0 text-muted small">
                            {/* CRITICAL FIX: Safe access for review author */}
                            "{review.comment}" - *Reviewed by {review.needyId?.name || 'Unknown User'}* </p>
                    </Card>
                ))
                ) : (
                 <Alert variant="info">No reviews received yet.</Alert>
                )}
            </>
        );
    };


    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="warning" />
                <p>Loading Provider Dashboard...</p>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <h2 className="text-center mb-5 text-warning"><FaToolbox className="me-2"/>Service Provider Dashboard</h2>
            
            {message && <Alert variant={message.type}>{message.text}</Alert>}

            
            


            {/* --- Navigation Tabs --- */}
            <Nav variant="tabs" defaultActiveKey="management" onSelect={(k) => setActiveTab(k)} className="mb-4">
                <Nav.Item>
                    <Nav.Link eventKey="management">Job Management</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="history">Analytics & History</Nav.Link>
                </Nav.Item>
            </Nav>
            {activeTab === 'history' && ( <AnalyticsView analytics={analytics} /> )} 

            <Row>
                {/* --- Column 1: Profile Management (Sticky) --- */}
                <Col md={4}>
                    <Card className="p-4 shadow-lg border-warning sticky-top" style={{ top: '20px' }}>
                        {profile && (
                            <div className="text-center mb-4 p-3 bg-light rounded">
                                <h4 className="text-warning mb-0">
                                    <FaStar className="me-2" /> **Average Rating:** {profile.averageRating?.toFixed(1) || '0.0'}
                                </h4>
                                <p className="text-muted small"> Based on {profile.totalReviews} reviews</p>
                                <hr className="my-2"/>
                            </div>
                        )}
                        <h4 className="text-center text-warning mb-4">Your Profile & Availability</h4>
                        
                        <Form onSubmit={handleProfileSubmit}>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Service Type</Form.Label>
                                <Form.Control type="text" value={profile?.serviceType} disabled />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Hourly Rate (₹)</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    name="hourlyRate" 
                                    value={profile?.hourlyRate || ''} 
                                    onChange={handleProfileChange} 
                                    required 
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Location</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="location" 
                                    value={profile?.location || ''} 
                                    onChange={handleProfileChange} 
                                    required 
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check 
                                    type="switch"
                                    id="isOpenForJobsSwitch"
                                    label={
                                        <>
                                            {profile?.isOpenForJobs ? <FaToggleOn className="text-success me-1" /> : <FaToggleOff className="text-danger me-1" />}
                                            {profile?.isOpenForJobs ? 'Open for Jobs' : 'Not Accepting Jobs'}
                                        </>
                                    }
                                    name="isOpenForJobs"
                                    checked={profile?.isOpenForJobs || false}
                                    onChange={handleProfileChange}
                                    className="fs-5"
                                />
                                <Form.Text muted>
                                    Toggling this off hides you from Needy users and job searches.
                                </Form.Text>
                            </Form.Group>

                            <div className="d-grid">
                                <Button variant="warning" type="submit">
                                    Update Profile
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Col>

                {/* --- Column 2: Assigned Jobs List --- */}
                <Col md={8}>
                    <h3 className="mb-4 text-secondary">Your Active Jobs ({jobs.length})</h3>
                    
                    {jobs.length > 0 ? (
                        jobs.map(job => (
                            <JobItem 
                                key={job._id} 
                                job={job} 
                                handleCompleteJob={handleCompleteJob}
                                handleJobResponse={handleJobResponse}
                            />
                        ))
                    ) : (
                        <Alert variant="info" className="mt-4">
                            You have no pending or accepted jobs. Check the Provider Home for new requests!
                        </Alert>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ProviderDashboard;