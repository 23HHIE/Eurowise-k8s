import { apiClient } from './ApiClient'

// API configuration for admin to fetch the details of user accounts
export const retrieveAllUsersApi
    = () => apiClient.get(`/users`)

// API configuration for admin to delete a targeted user account
export const deleteUserApi = (id) =>
    apiClient.delete(`/users/${id}`)

// API configuration for admin to modify a user account
export const ModifyUserApi = (id, user) =>
    apiClient.put(`/edit/users/${id}`, JSON.stringify(user))

