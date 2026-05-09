import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Add axios interceptor for JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="903946059443-m6lqrfifmqg0339hhri64e17i4qbgl13.apps.googleusercontent.com">
      <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
        <App />
      </GoogleReCaptchaProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)

