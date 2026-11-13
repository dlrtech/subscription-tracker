import { Link } from 'react-router-dom'
import AuthShell, { cardClass } from '../components/AuthShell'
import Mascot from '../components/Mascot'

export default function NotFound() {
  return (
    <AuthShell>
      <div className={`${cardClass} text-center`}>
        <Mascot mood="thinking" color="lemon" className="floaty mx-auto size-28" />
        <h1 className="text-2xl font-extrabold">Sayfa bulunamadı</h1>
        <p className="text-sm muted">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link to="/" className="btn btn-primary">Ana sayfaya dön</Link>
      </div>
    </AuthShell>
  )
}
