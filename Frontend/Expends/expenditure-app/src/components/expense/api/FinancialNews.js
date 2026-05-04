import { apiClient } from './ApiClient'

// API configuration to fetch data of financial news
export const retrieveFinancialNewsApi = () =>
    apiClient.get(`/financial-news`)