
import { apiClient } from './ApiClient'


//  API configuration to fetch all details of expenses based on a type
export const retrieveAllExpensesForTypeApi
    = (type) => apiClient.get(`/${type}/expenses`)

// API configuration to fetch all details of expenses based on specific user with designed currency and searched type
export const retrieveAllExpensesForUsernameApi
    = (username, type, currency) => apiClient.get(`/${username}/expenses/${currency}?type=${type}`);

// API configuration to delete a targeted expense 
export const deleteExpenseApi = (username, id) =>
    apiClient.delete(`/users/${username}/expenses/${id}`)

// API configuration to fetch details of a targeted expense
export const retrieveExpenseApi = (username, id) =>
    apiClient.get(`/users/${username}/expenses/${id}`)

// API configuration to modify a targeted expense
export const updateExpenseApi = (username, id, expense) =>
    apiClient.put(`/users/${username}/expenses/${id}`, expense)

// API configuration to create a new expense
export const createExpenseApi = (username, expense) => {
    apiClient.post(`/users/${username}/expense`, expense)
}

