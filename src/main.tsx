import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { testAPI } from './test-api.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Make testAPI available in browser console for debugging
if (import.meta.env.DEV) {
  (window as any).testAPI = testAPI
  console.log('💡 Tip: Run testAPI() in console to test API configuration')
}
