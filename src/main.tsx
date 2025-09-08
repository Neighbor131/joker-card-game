import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

console.log('JOKER BUILD:', 'v8')  // ← change this number on each deploy

createRoot(document.getElementById('root')!).render(<App />)
