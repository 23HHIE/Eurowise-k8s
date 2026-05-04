// The API for modifying account details is shared with adding new users and register
// The difference is the pre-condition

import { React, useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { retrieveAllUsersApi, deleteUserApi } from './api/AdminApiService';

// Define the logic of user management component
const UserList = () => {
    // Declare a variable to store the state of mode with the default mode "add" in the current context
    const [mode, setMode] = useState('add');

    // Declare a variable to store the state of message in the current context
    const [message, setMessage] = useState(null)

    // Declare a variable to store the state of users in the current context
    const [users, setUsers] = useState([]);

    // Declare a variable to store the state of show modal in the current context with the default mode of false
    const [showModal, setShowModal] = useState(false);

    //Declare the state of email, name, password, and role for the function of adding new users
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');

    // Declare the state of targeted user selecting in the current context
    const [selectedUser, setSelectedUser] = useState(null);

    // Define the logic of retrieving all users with async method
    const handleRetrieveAllUsers = async () => {
        try {
            // Declare a variable to store the response from calling the API 
            const response = await retrieveAllUsersApi();

            // Update the state of users with the data of the response
            setUsers(response.data);
        } catch (error) {
            // Handle the error event
            console.error('Fail to fetch users', error);
        }
    };

    // Define the logic of user account deletion with the given id
    const onDeleteUser = async (id) => {
        // Logging the operation on the console to check the id 
        console.log(`Deleting user with id: ${id}`);
        try {
            // Declare a variable to store the response from calling the API
            const response = await deleteUserApi(id);

            // Update the state of the message with the id of the deleted user
            setMessage(`Delete of user with ${id} successful`)

            // Call the API to retrieve all users to refresh the user list
            handleRetrieveAllUsers()

        } catch (error) {
            // Handle the error event
            console.error('Error deleting user:', error);
            throw error;
        }
    };

    // Define the logic of modifing user function
    const handleModifyUser = (user) => {
        // Logging the user detail to check if it is the targeted user
        console.log("User Object:", user);

        // Switch the mode from "add" to "modify" 
        setMode('modify')

        // Update the state of seletedUser with the detail of "user"
        setSelectedUser(user);

        // Update the state of email, name, password, role with the details of the user and the state of modal 
        setEmail(user.email || '');
        setName(user.name || '');
        setPassword(user.password || '');
        setRole(user.role || '');
        setShowModal(true);
    };


    // Define the logic of the user account list after adding new users
    const handleUserAdded = () => {
        // Close the modal
        handleCloseModal();

        // Call the API to refresh the user account list
        handleRetrieveAllUsers();
    };

    // Define the logic of adding a new user
    const handleAddNewUser = () => {
        // Update the state of mode to "add"
        setMode('add');

        // Switch the state of show modal to open the modal
        setShowModal(true);
    };

    // Define the logic of closing the modal
    const handleCloseModal = () => {
        // Close the modal by updatting the state of show modal from true to false
        setShowModal(false);
    };


    // Define the logic of adding a new user and modifying the user
    const handleSubmit = (e) => {
        // Prevent default form submission
        e.preventDefault();

        // Create an object composed of the email, name, password and role
        const requestData = {
            email: email,
            name: name,
            password: password,
            role: role,
        }

        // Declare the URL of the request based on the state of the selectedUser
        const url = selectedUser && selectedUser.id
            ? `http://localhost:8080/edit/users/${selectedUser.id}`
            : 'http://localhost:8080/register';

        // Logging the detail of the URL
        console.log("Request URL:", url);

        // Declare the method of request to be PUT or POST based on the state of the selectedUser
        const method = selectedUser ? 'PUT' : 'POST';

        // Create the configuration of the request
        const configuration = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            url,
            data: requestData,
        };

        // Declare the request using axios with given configuration
        axios(configuration)
            .then((result) => {
                console.log(result);

                // Call the function to refresh the user account list
                handleUserAdded();

            })
            // Handle error event
            .catch((error) => {
                console.log(error);
            });
    };

    // Rendering the page when loading the paging initially
    useEffect(() => {
        handleRetrieveAllUsers();
    }, [])

    // Rendering the page after updatting the state of the selectedUser
    useEffect(() => {
        console.log("Selected User Updated:", selectedUser);
    }, [selectedUser]);

    return (
        <Container>
            {/* Rendering the message on the top */}
            <Row className="mt-3">
                <Col md={12}>
                    {message && <div className="alert alert-warning">{message}</div>}
                </Col>
            </Row>

            <Row className="mt-3">
                <Col md={12} className="overflow-auto">
                    {/* Rendering the table to display the details of users */}
                    <Table striped bordered hover responsive className="table-borderless">
                        <thead>
                            <tr style={{ fontSize: '25px' }}>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Delete</th>
                                <th>Modify</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '20px' }}>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>

                                    {/* Rendering the delete button */}
                                    <td>
                                        <Button variant="danger" onClick={() => onDeleteUser(user.id)}>
                                            Delete
                                        </Button>
                                    </td>

                                    {/* Rendering the modify button */}
                                    <td>
                                        <Button variant="success" onClick={() => handleModifyUser(user, user.id)}>
                                            Modify
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            {/* Rendering the adding new user button */}
            <Row className="mt-3">
                <Col md={12}>
                    <Button variant="success" onClick={() => handleAddNewUser()}>
                        Add New User
                    </Button>
                </Col>
            </Row>

            {/* Rendering the modal for adding new users or modifying a targeted user */}
            <Modal show={showModal} onHide={handleCloseModal}>
                {/* Rendering the title of the modal based on the state of the selectedUser */}
                <Modal.Header closeButton>
                    <Modal.Title>
                        {mode === 'modify' ? 'Modify User' : 'Add a New User'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email"
                            />
                        </Form.Group>

                        <Form.Group controlId="formBasicName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Username"
                            />
                        </Form.Group>


                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                            />
                        </Form.Group>

                        <Form.Group controlId="formBasicRole">
                            <Form.Label>Role</Form.Label>
                            <Form.Control
                                type="text"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Role"
                            />
                        </Form.Group>



                        <Button variant="success" type="submit" style={{ marginTop: '15px' }}>
                            {mode === 'modify' ? 'Modify User' : 'Add a New User'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>


    );
};

export default UserList;
