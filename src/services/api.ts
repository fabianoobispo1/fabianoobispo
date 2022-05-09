import axios from 'axios'

export const api = axios.create({
    baseURL: '/api'
})

export const apiExterna = axios.create({
    baseURL:   process.env.NEXT_PUBLIC_EX_URL_API
    
})

