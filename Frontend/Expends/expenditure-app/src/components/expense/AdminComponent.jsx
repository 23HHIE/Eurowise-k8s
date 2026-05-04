import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import UserList from './UserListComponent';
import { retrieveAllUsersApi } from './api/AdminApiService';



// Define the Admin management component function
const AdminUserManagementPage = () => {

    // Store the user state in the context
    const [users, setUsers] = useState([]);

    // Store the message state in the context
    const [message, setMessage] = useState(null)

    // Render the page when calling the method of handleRetrieveAllUsers
    useEffect(() => {
        handleRetrieveAllUsers()
    }, []);

    // Define the function to retrieve all users
    const handleRetrieveAllUsers = async () => {

        try {
            // Await the response from the API call to retrieve all users
            const response = await retrieveAllUsersApi();

            // Set the data of the response to the status in current context
            setUsers(response.data)
        } catch (error) {
            // Log error info to the console
            console.error('Fail to fetch users', error)
        }
    }


    return (
        <Container>
            <Row>
                <Col>
                    <h2>Admin User Management</h2>
                    {/* Display a message alert when it exists in the context */}
                    {message && <div className="alert alert-warning">{message}</div>}
                </Col>

            </Row>


            <Row>
                <Col>
                    <UserList users={users} />
                </Col>
            </Row>
        </Container>
    );
};

export default AdminUserManagementPage;
