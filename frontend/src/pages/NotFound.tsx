import { Link } from 'react-router-dom'
import AuthShell, { cardClass } from '../components/AuthShell'

export default function NotFound() {
  return (
    <AuthShell>
      <div className={`${cardClass} text-center`}>
        <div className="text-5xl">🫠</div>
        <h1 className="text-2xl font-extrabold">Sayfa bulunamadı</h1>
        <p className="text-sm muted">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link to="/" className="btn btn-primary">Ana sayfaya dön</Link>
      </div>
    </AuthShell>
  )
}
