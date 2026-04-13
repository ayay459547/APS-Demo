import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp } from 'antd'

import './index.css'
// import '@/assets/css/normalize.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASE_URL}>
      <AntdApp>
        <App />
      </AntdApp>
    </BrowserRouter>
  </StrictMode>
)
