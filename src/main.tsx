import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/context/I18nContext'
import { AppearanceEffects, PreferencesProvider } from '@/context/PreferencesContext'
import { storageService } from '@/services/storageService'
import './index.css'

// Discard any stale stored payload before the first render.
storageService.ensureVersion()

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found in index.html')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <I18nProvider>
          <AppearanceEffects />
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)
