import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import {
  Dashboard, DocumentEditorPage, DocumentsPage, SettingsPage, TemplatesPage, ViewDocumentPage,
} from './pages.jsx';

export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="templates" element={<TemplatesPage />} />
    <Route path="create" element={<DocumentEditorPage />} />
    <Route path="create/:typeId" element={<DocumentEditorPage />} />
    <Route path="edit/:id" element={<DocumentEditorPage mode="edit" />} />
    <Route path="view/:id" element={<ViewDocumentPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes>;
}
