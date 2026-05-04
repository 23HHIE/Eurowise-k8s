import { apiClient } from './ApiClient'

// API configuration for users to get authentication with credentials
export const executeJwtAuthenticationService = (username, password) =>
    apiClient.post(`/authenticate`, { username, password })

