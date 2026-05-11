import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import Layout from './components/Layout'
import LoginPage         from './pages/LoginPage'
import DashboardPage     from './pages/DashboardPage'
import NoteListPage      from './pages/NoteListPage'
import NoteDetailPage    from './pages/NoteDetailPage'
import AddNotePage       from './pages/AddNotePage'
import StatsPage         from './pages/StatsPage'
import ReviewSessionPage from './pages/ReviewSessionPage'
import SrsOverviewPage   from './pages/SrsOverviewPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route index                  element={<DashboardPage />} />
                <Route path="notes"           element={<NoteListPage />} />
                <Route path="notes/add"       element={<AddNotePage />} />
                <Route path="notes/:id"       element={<NoteDetailPage />} />
                <Route path="notes/:id/edit"  element={<AddNotePage />} />
                <Route path="stats"           element={<StatsPage />} />
                <Route path="srs"             element={<SrsOverviewPage />} />
                <Route path="review"          element={<ReviewSessionPage />} />
                <Route path="*"               element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
