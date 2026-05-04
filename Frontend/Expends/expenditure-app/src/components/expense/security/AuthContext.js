import { createContext, useContext, useState } from "react"
import { executeJwtAuthenticationService } from "../api/AuthenticationApiService"
import { apiClient } from "../api/ApiClient"



// Create a context
export const AuthContext = createContext()

// Create a React hook to fetch the data of the context for authentication
export const useAuth = () => useContext(AuthContext)


// Create the provider component of the context to share the authentication data with other components
export default function AuthProvider({ children }) {


    // Store authentication state in the context and use isAuthenticated to specify that whether the user is authenticated
    const [isAuthenticated, setAuthenticated] = useState(false)

    // Store the state of username, role, token in the context
    const [username, setUsername] = useState(null)
    const [role, setRole] = useState(null)
    const [token, setToken] = useState(null)


    // Create an async function to implement the login process of users
    async function login(username, password) {

        try {
            // Create a response to store the result of API access using JWT authentication with a username and a password
            const response = await executeJwtAuthenticationService(username, password)

            // Await the data from the response object obtained from the API call
            await response.data;

            // Log the properties of the response
            console.log(response)

            // Check if the response status is 200 and the response is valid
            if (response.status === 200 && response.data.data && response.data.data.token) {
                // Create a variable to store the token
                const jwtToken = 'Bearer ' + response.data.data.token

                // Create a variable to store the role value from the response
                const role = response.data.data.role

                // Set the authentication status to true for this context
                setAuthenticated(true)

                // Set the username status with the given username for this context
                setUsername(username)

                // Set the role status for this context
                setRole(role)

                // Set the token status for this context
                setToken(jwtToken)

                // Store the JWT token in the local storage to maintain user's logged-in status until logout
                localStorage.setItem("token", jwtToken);

                // Retrieve the JWT token from the local storage   
                localStorage.getItem("token");

                // Attach an authentication token on the request for identity authentication
                apiClient.interceptors.request.use(
                    (config) => {
                        // Logging the JWT token
                        console.log('intercepting and adding a token ', jwtToken)

                        // Adding the JWT token in the request header
                        config.headers.Authorization = jwtToken

                        // Reture the modified config object
                        return config
                    }
                )
                return true

            } else {
                // Logout the user and return the false status of the user authentication
                logout()
                return false
            }
        } catch (error) {
            // Handle an error scenario
            logout()
            return false
        }
    }

    // Define the logout function
    function logout() {

        // Set the authenctation status false and clear the status of the token, username, role for current context
        setAuthenticated(false)
        setToken(null)
        setUsername(null)
        setRole(null)

    }


    return (
        // Use a context provider to pass the value of isAuthenticated, login, logout, username, role, and token to the current context to share with other components
        <AuthContext.Provider value={{ isAuthenticated, login, logout, username, role, token }}>
            {children}
        </AuthContext.Provider>
    )
}
