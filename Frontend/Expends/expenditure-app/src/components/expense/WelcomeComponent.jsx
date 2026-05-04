import { Link } from "react-router-dom"
import { useState } from "react"

import { useAuth } from "./security/AuthContext"
import Button from '@mui/material/Button';

// Define the logic of the welcome component
function WelcomeComponent() {

    // Declare a variable to store the authentication status
    const authContext = useAuth()

    // Create a variable to store the value of username in the current context
    const username = authContext.username

    // Create a variable to store the value of role in the current context
    const userRole = authContext.role




    return (

        <div className="custom-wel-bg me-auto">
            <div className="WelcomeComponent">
                <h1 style={{ fontSize: '28px', padding: '20px' }}>Welcome {username}!</h1>

                <div style={{ fontSize: '26px' }}>
                    {/* Rendering the expense tracking when the userrole is a user */}
                    {
                        userRole === 'USER' && (
                            <>
                                <p>Time to Track Your Expenses</p>
                                <Link to='/details' style={{ textDecoration: 'none' }}>
                                    <Button className="wel-button" variant="primary">
                                        Start
                                    </Button>
                                </Link>
                            </>
                        )
                    }

                </div>

                {/* Rendering the button navigate to the financial news page */}
                <div>
                    <Link to='/news' style={{ textDecoration: 'none' }}>
                        <Button variant="contained" color="success" style={{ margin: '18px' }}>
                            Financial News Update
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default WelcomeComponent