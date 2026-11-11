import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/giris" element={<AuthPage mode="login" />} />
      <Route path="/kayit" element={<AuthPage mode="register" />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/abonelikler" element={<Subscriptions />} />
        <Route path="/app/profil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
