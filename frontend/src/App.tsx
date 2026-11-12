import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth'
import AppLayout from './components/AppLayout'
import Backdrop from './components/Backdrop'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Profile from './pages/Profile'

export default function App() {
  return (
    <>
      <Backdrop />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/giris" element={<AuthPage mode="login" />} />
          <Route path="/kayit" element={<AuthPage mode="register" />} />
          <Route path="/sifremi-unuttum" element={<ForgotPassword />} />
          <Route path="/sifre-sifirla" element={<ResetPassword />} />
          <Route path="/dogrula" element={<VerifyEmail />} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/abonelikler" element={<Subscriptions />} />
            <Route path="/app/profil" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  )
}
