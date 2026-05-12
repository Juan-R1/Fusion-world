import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupErrorCapture } from './lib/errorCapture.js'
import App from './App.jsx'

setupErrorCapture()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
