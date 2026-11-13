import { Link } from 'react-router-dom'
import AuthShell, { cardClass } from '../components/AuthShell'
import Icon from '../components/Icon'

export default function NotFound() {
  return (
    <AuthShell>
      <div className={`${cardClass} text-center`}>
        <div aria-hidden="true" className="floaty mx-auto grid size-16 place-items-center rounded-3xl bg-lemon text-ink"><Icon name="compass" className="size-8" /></div>
        <h1 className="text-2xl font-extrabold">Sayfa bulunamadı</h1>
        <p className="text-sm muted">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link to="/" className="btn btn-primary">Ana sayfaya dön</Link>
      </div>
    </AuthShell>
  )
}
