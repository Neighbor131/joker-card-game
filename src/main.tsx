import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

console.log('JOKER BUILD:', 'v14')  // bump this when you deploy

createRoot(document.getElementById('root')!).render(<App />)
