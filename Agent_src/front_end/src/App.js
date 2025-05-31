// App.js
import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function App() {
  // — AUTH STATE —
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')

  // On mount, check if we already have a token
  useEffect(() => {
    const token = localStorage.getItem('jwt')
    if (token) setIsAuthenticated(false) //if find token in logcalStorage sign in directly
  }, [])

  // Create axios instance
  const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' },
  })
  // Attach JWT to every request
  api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('jwt')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
  })

  // — LOGIN HANDLER —
  const handleLogin = async e => {
    e.preventDefault()
    setLoginError('')
    try {
      const { data } = await api.post('/login', loginData) //call login function from backend
      localStorage.setItem('jwt', data.access_token)
      setIsAuthenticated(true)
    } catch (err) {
      setLoginError('Invalid username or password')
    }
  }

  // — CHAT STATE & HANDLERS —
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome! Ask me for a financial analysis.' },
  ])
  const [input, setInput] = useState('')

  const sendMessage = async () => {
    if (!input.trim()) return //if input is empty, return
    // show user message
    setMessages(m => [...m, { from: 'user', text: input }])
    const msg = input
    setInput('')
    try {
      const { data } = await api.post('/chat', { message: msg })
      setMessages(m => [...m, { from: 'bot', text: data.reply }])
    } catch {
      setMessages(m => [...m, { from: 'bot', text: 'Server error.' }])
    }
  }

  const onKey = e => {
    if (e.key === 'Enter') sendMessage()
  }

  // — RENDER —
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={loginData.username}
              onChange={e =>
                setLoginData(d => ({ ...d, username: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={e =>
                setLoginData(d => ({ ...d, password: e.target.value }))
              }
              required
            />
          </div>
          {loginError && <p className="error">{loginError}</p>}
          <button type="submit">Log In</button>
        </form>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="input-bar">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type your question…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}
