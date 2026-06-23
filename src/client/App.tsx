import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import VaultsPage from './pages/VaultsPage'
import MetadataPage from './pages/MetadataPage'
import PlaceholderPage from './pages/PlaceholderPage'
import DocsPage from './pages/DocsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="vaults" element={<VaultsPage />} />
          <Route path="metadata" element={<MetadataPage />} />
          <Route path="body-note" element={<PlaceholderPage title="Body note" />} />
          <Route path="analysis" element={<PlaceholderPage title="Analysis" />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:slug" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
