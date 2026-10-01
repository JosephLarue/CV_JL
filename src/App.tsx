import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Admin from './pages/admin/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
