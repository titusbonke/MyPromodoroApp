import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

import { BrowserRouter } from 'react-router-dom'

// Register PWA service worker with autoUpdate configuration
registerSW({
  onOfflineReady() {
    console.log('Pomodoro PWA is ready for offline use.')
  },
  onNeedRefresh() {
    console.log('New content available, please refresh.')
  }
})

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
