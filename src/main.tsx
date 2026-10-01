import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LangProvider } from './i18n/LangContext'
import { ThemeProvider } from './theme/ThemeContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
