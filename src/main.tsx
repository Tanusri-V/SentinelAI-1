import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout.tsx'

const HeroPage = lazy(() => import('./pages/HeroPage.tsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'))
const AlertsPage = lazy(() => import('./pages/AlertsPage.tsx'))
const ModelPage = lazy(() => import('./pages/ModelPage.tsx'))

function Fallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Suspense fallback={<Fallback />}><HeroPage /></Suspense>} />
          <Route path="dashboard" element={<Suspense fallback={<Fallback />}><DashboardPage /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<Fallback />}><AlertsPage /></Suspense>} />
          <Route path="model" element={<Suspense fallback={<Fallback />}><ModelPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)