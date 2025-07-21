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
    baseURL: 'http://localhost:8000', // backend location
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
      const { data } = await api.post('/chat', { message: msg }) //data is a json defined by "chatResponse"
      setMessages(m => [...m, { from: 'bot', text: data.reply }])
    } catch {
      setMessages(m => [...m, { from: 'bot', text: 'Server error.' }])
    }
  }

  const onKey = e => { //whenever press the key, invoke the function
    if (e.key === 'Enter') sendMessage()
  }

// — RENDER —
if (!isAuthenticated) {
  // Render the login form…
  return (
    <div className="login-container">                               // Wrapper div for styling the login section
      <h2>Login</h2>                                                // Title for the login box

      <form onSubmit={handleLogin}>                                // Form element; calls handleLogin when submitted
        <div>                                                      // Container for username field
          <label>Username:</label>                                  // Static label text
          <input
            type="text"                                            // Input type: plain text
            value={loginData.username}                            // Controlled: value comes from loginData.username state
            onChange={e =>                                       // On each keystroke…
              setLoginData(d => ({ …d, username: e.target.value })) // …merge new username into state
            }
            required                                              // Browser-level required validation
          />
        </div>

        <div>                                                      // Container for password field
          <label>Password:</label>                                 // Static label text
          <input
            type="password"                                        // Input type: password (obscures characters)
            value={loginData.password}                            // Controlled: value comes from loginData.password state
            onChange={e =>                                       // On each keystroke…
              setLoginData(d => ({ …d, password: e.target.value }))// …merge new password into state
            }
            required                                              // Browser-level required validation
          />
        </div>

        {loginError && <p className="error">{loginError}</p>}      // If loginError is truthy, render an error message

        <button type="submit">Log In</button>                      // Button submits the form, triggering handleLogin
      </form>
    </div>
  )
}

// If we reach here, the user **is** authenticated, so show the chat UI…
return (
  <div className="chat-container">                                 // Wrapper div for the entire chat interface
    <div className="messages">                                     // Container for the message list
      {messages.map((m, i) => (                                    // Loop over each message object
        <div key={i} className={`msg ${m.from}`}>                  // Each message: unique key + CSS class based on sender
          {m.text}                                                 // Display the message text
        </div>
      ))}
    </div>

    <div className="input-bar">                                    // Bottom bar for typing and sending new messages
      <input
        value={input}                                              // Controlled: value comes from input state
        onChange={e => setInput(e.target.value)}                   // Update input state on every keystroke
        onKeyDown={onKey}                                          // Optional: handle “Enter” or other key events
        placeholder="Type your question…"                          // Placeholder text when the field is empty
      />
      <button onClick={sendMessage}>Send</button>                  // Clicking calls sendMessage()
    </div>
  </div>
)
