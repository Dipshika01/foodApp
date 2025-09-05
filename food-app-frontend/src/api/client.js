import axios from 'axios'

export const api = (token) => {
  const instance = axios.create({
    baseURL: '/api', 
  })
  if (token) {
    // automatically attach auth headers to all requests, so in place of axios.get("http://localhost:5000/auth/login"),
    // we can simply use api().get("/auth/login")
    instance.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }
  return instance
}
