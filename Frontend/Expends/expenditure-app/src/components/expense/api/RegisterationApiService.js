import { apiClient } from './ApiClient'

//  API configuration to use headrs and payload for registration
export const executeRegistrationService = (registrationData) =>
    apiClient.post('/register', registrationData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });