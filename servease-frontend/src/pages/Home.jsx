// servease-frontend/src/pages/Home.jsx
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import '../assets/styles/home.css';

const Home = () => {
    return (
        
        <Container className="mt-5 home-container">
            <Row className="text-center">
                <Col>
                    <h1 className="display-4">Your Services, Simplified. <br /> Connect with Top Professionals Instantly.</h1>
                    <p className="lead">From home repairs to tech support, find trusted experts for your need.</p>
                </Col>
            </Row> 
            <Row className="mt-5">
                <Col md={6}>
                    <Card className="shadow-lg border-success join-cards">
                        <Card.Body className="text-center">
                            <Card.Title className="text-success">I'm The Needy</Card.Title>
                            <Card.Text>
                                Find plumbers, electricians, and more! Post a job or book a provider directly.
                            </Card.Text>
                            <Button variant="success" size="lg" href="/register" className="register-btn">
                                Get Started as Needy
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-lg border-warning join-cards provider">
                        <Card.Body className="text-center">
                            <Card.Title className="text-warning">I'm a Service Provider</Card.Title>
                            <Card.Text>
                                Find local jobs that match your skills. Set your rates and availability.
                            </Card.Text>
                            <Button variant="warning" size="lg" href="/register" className="register-btn">
                                Join as Provider
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
  
    );
};

export default Home;