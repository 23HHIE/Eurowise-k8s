import axios from 'axios'

// API client configuration to communnicate with the local host server
export const apiClient = axios.create(
    {
        baseURL: 'http://localhost:8080'
    }
)

// API client configuration to communnicate with the backend server hosted on heroku
// export const apiClient = axios.create(
//     {
//         baseURL: 'https://eurowise-98c1d6946202.herokuapp.com/'
//     }
// )
