
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './HomePage.css';

// Define the logic of the home page component
const HomePage = () => {
    return (
        <div className='home-page'>
            <Container className='right-top-container'>
                <Row>
                    <Col xs lg="8">
                    </Col>
                    <Col xs lg="4">
                        <h3>Track every euro, convert currencies effortlessly, and stay ahead with top financial news.</h3>
                    </Col>
                </Row>
            </Container>

            <div className='bottom-right-container'>
                <Container>
                    <Col xs lg="9">
                        <p>Start your track </p>
                        {/* Link to the login pgae */}
                        <Link to="/login">
                            <Button variant="primary" className="custom-button" >Get Started</Button>
                        </Link>
                    </Col>
                </Container>
            </div>
        </div>
    );
};

export default HomePage;
