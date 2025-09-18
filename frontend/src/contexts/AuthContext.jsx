import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, endpoints } from '../utils/api'

// -------------------- Auth Context --------------------
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await api.get('/user/me')
      const userData = response.data
      const username = userData.email.split('@')[0]
      setUser({ ...userData, username })
    } catch (error) {
      console.error('Token verification failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await endpoints.login({ email, password })
      const { access_token } = response.data

      localStorage.setItem('token', access_token)
      setToken(access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      try {
        const userResponse = await api.get('/user/me')
        const userData = userResponse.data
        const username = userData.email.split('@')[0]
        setUser({ ...userData, username })
      } catch (userError) {
        console.warn('Could not fetch user data:', userError)
        setUser({ email, username: email.split('@')[0] })
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed'

      if (error.response?.status === 401) {
        errorMessage = 'Invalid Credentials'
      } else if (error.response?.status === 404) {
        errorMessage = 'Invalid Credentials'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      return { success: false, error: errorMessage }
    }
  }

  const signup = async (email, password) => {
    try {
      await endpoints.register({ email, password })
      return await login(email, password)
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// -------------------- Login Page --------------------
function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault?.() // just in case it’s in a form
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error)
    } else {
      setError('')
    }
  }

  return (
    <div style={{ maxWidth: '300px', margin: '50px auto' }}>
      <h2>Login</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={{ display: 'block', marginBottom: '10px', width: '100%' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={{ display: 'block', marginBottom: '10px', width: '100%' }}
      />
      <button onClick={handleLogin}>Login</button>

      {error && (
        <div style={{ marginTop: '12px', color: 'red' }}>
          {error}
        </div>
      )}
    </div>
  )
}

