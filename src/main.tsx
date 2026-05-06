import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import AppErrorBoundary from '@/app/AppErrorBoundary'
import App from "@/app/AppWorkspaceCoreImpl";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
