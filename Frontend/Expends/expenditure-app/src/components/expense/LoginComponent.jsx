import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './security/AuthContext'
import { Container, Form, Row, Col, Alert, Button, } from 'react-bootstrap';

// Define the logic of the login component
function LoginComponent() {

    // Put the status of the username, the password, and the showErrorMessage in the current context
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showErrorMessage, setShowErrorMessage] = useState(false)

    // Initialize the useNavigate hook
    const navigate = useNavigate()

    // Use a hook to retrieve the authentication context
    const authContext = useAuth()

    // Define the event handler for the change of username
    function handleUsernameChange(event) {
        // Set the username status from the value that was inputted
        setUsername(event.target.value)
    }

    // Define the event handler for changed password
    function handlePasswordChange(event) {
        // Set the password status from the value that was inputted
        setPassword(event.target.value)
    }

    // Define the function to handle the submission in async request
    async function handleSubmit() {
        // Navigate to the welcome page if login request is authenticated
        if (await authContext.login(username, password)) {
            console.log(authContext.data)
            navigate(`/welcome/${username}`)

        } else {
            // Display the error message if the request is failed
            setShowErrorMessage(true)
        }

    }

    return (
        <Container className="Login" style={{ marginTop: '100px', maxWidth: '50%' }}>

            <Row className="justify-content-center mt-5">
                <Col xs={12} md={6}>
                    <h2 className="text-center mb-4">
                        Time to Login!
                    </h2>
                    {/* Rendering error message */}
                    {showErrorMessage && (
                        <Alert variant="danger" className="text-center">
                            Authentication Failed. Please check your credentials.
                        </Alert>
                    )}
                    {/* Rendering the login form */}
                    <Form >
                        <Form.Group controlId='formBasicUsername' className="justify-content-left mb-3">
                            <Form.Label>User Name</Form.Label>
                            <Form.Control
                                type='text'
                                name='username'
                                value={username}
                                onChange={handleUsernameChange}
                                placeholder='Enter username'
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId='formBasicPassword' className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type='password'
                                name='password'
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder='Enter password'
                                required
                            />
                        </Form.Group>

                        <Button variant='success' type='button' className="w-45" onClick={handleSubmit}>
                            Login
                        </Button>
                    </Form>
                </Col>
            </Row>

        </Container>


    )
}

export default LoginComponent