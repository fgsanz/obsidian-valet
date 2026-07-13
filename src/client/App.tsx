import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import VaultsPage from './pages/VaultsPage'
import MetadataPage from './pages/MetadataPage'
import ContentPage from './pages/ContentPage'
import AnalysisPage from './pages/AnalysisPage'
import DocsPage from './pages/DocsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="vaults" element={<VaultsPage />} />
          <Route path="metadata" element={<MetadataPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:slug" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
