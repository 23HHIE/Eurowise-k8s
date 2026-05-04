import React, { useState } from "react";
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from "react-router-dom"
import axios from "axios";

// Define the sign up function
export default function SignUp() {

    // Store the status of the email, name, password, register in the current context
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [register, setRegister] = useState(false);

    // Initialize the useNavigate hook
    const navigate = useNavigate();


    // Define the function to handle the submit
    const handleSubmit = (e) => {
        // Prevent default form submission
        e.preventDefault();

        // Create an object composed of the email, name and password
        const requestData = {
            email,
            name,
            password,
        };

        // Configuration for a post request to the registration
        const configuration = {

            // Use the POST method
            method: 'post',

            // Set the content type to JSON
            headers: {
                'Content-Type': 'application/json',
            },

            // Specify the registration URL  
            url: 'http://localhost:8080/register',

            // Add the data into the request
            data: requestData,
        };

        // Make an axios request to commucate with backend
        axios(configuration)

            // If the request has been successful send out and proceed the following 
            .then((result) => {
                // Set the register status to true
                setRegister(true);
                // Store the token from the response into the local storage if it exists
                if (result.data.token) {
                    localStorage.setItem("token", result.data.token);
                }
                // Display a submission alert
                alert("Submitted");
                // Navigate to the welcome page
                navigate(`/welcome/${name}`);
            })
            .catch((error) => {
                // Handle the error event by logging on the console
                console.log(error);
            });
    };


    return (
        <>
            <Container style={{ marginTop: '90px', marginBottom: '10px', maxWidth: '800px' }}>
                <Row className="justify-content-center">
                    <Col xs={12} md={6} style={{ backgroundColor: '#e9e9e9', borderRadius: '15px' }}>
                        <Form onSubmit={(e) => handleSubmit(e)}>
                            <h3 className="mb-4 text-center">Create an Account</h3>
                            {/* Rendering of the email */}
                            <Form.Group controlId='formBasicEmail' className="FormGroup">
                                <Form.Label className="FormGroupLabel">Email</Form.Label>
                                <Form.Control
                                    type='email'
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder='Enter email'
                                    required

                                />
                            </Form.Group>
                            {/* Rendering of the name */}
                            <Form.Group controlId='formBasicName' className="FormGroup">
                                <Form.Label className="FormGroupLabel">Name</Form.Label>
                                <Form.Control
                                    type='text'
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder='Username'
                                    required
                                />
                            </Form.Group>
                            {/* Rendering of the password */}
                            <Form.Group controlId='formBasicPassword' className="FormGroup">
                                <Form.Label className="FormGroupLabel">Password</Form.Label>
                                <Form.Control
                                    type='password'
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder='Password'
                                    required
                                />
                            </Form.Group>
                            {/* Submit button */}
                            <Button variant='primary' type='submit' className="w-30 mt-3 mb-5" >
                                Sign Up
                            </Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    )
}