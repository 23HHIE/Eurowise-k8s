import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { Image } from 'react-bootstrap';
import { Link } from "react-router-dom"
import Navbar from 'react-bootstrap/Navbar';
import { useAuth } from "./security/AuthContext"
import { useNavigate } from "react-router-dom"

function Header() {
    // Declare a variable to store the authentication status
    const authContext = useAuth()

    // Declare a variable to store the status of authentication in current context
    const isAuthenticated = authContext.isAuthenticated

    // Declare a variable to store the value of role in the authenticated context
    const userRole = authContext.role;

    // Initialize the useNavigate hook
    const navigate = useNavigate();

    // Define the logic of logout function
    const logout = () => {
        // Execute the logout function of the authentication context
        authContext.logout()
        // Navi to the logout page
        navigate('/logout')
    }
    return (

        <Navbar expand="lg" className="custom-navbar">
            <Container>
                {/* Rendering the logo */}
                <Navbar.Brand>
                    <Link to="/">
                        <Image
                            src={process.env.PUBLIC_URL + '/images/logo.png'}
                            alt="Eurowise"
                            style={{ maxWidth: '170px', width: '100%', height: 'auto' }}
                        />
                    </Link>
                </Navbar.Brand>

                {/* Rendering the menu on small screens */}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* Rendering links when the user is authencticated */}
                        {isAuthenticated && (
                            <>
                                {/* Rendering the link to the home page */}
                                <Nav.Link as={Link} to="/welcome/:username">Home</Nav.Link>
                                {/* Rendering the link to expense details when the role of user is user */}
                                {userRole === 'USER' && (
                                    <Nav.Link as={Link} to="/details">Details</Nav.Link>
                                )}
                                {/* Rendering the link to the financial news when the role is user */}
                                {userRole === 'USER' && (
                                    <Nav.Link as={Link} to="/news">Financial News</Nav.Link>
                                )}
                                {/* Rendering the link to users management page when the role is admin */}
                                {userRole === 'ADMIN' && (
                                    <Nav.Link as={Link} to="/admin">User Management</Nav.Link>
                                )}

                            </>
                        )}
                    </Nav>
                    <Nav >
                        {/* Rendering the link to logout */}
                        {isAuthenticated && (
                            <Nav.Link as={Link} to="/logout" onClick={logout}>Logout</Nav.Link>
                        )}
                        {/* Rendering the links to login and register when the user is not authenticated */}
                        {!isAuthenticated && (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register">Sign Up</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;