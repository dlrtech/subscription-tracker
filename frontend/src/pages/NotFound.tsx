import { Link } from 'react-router-dom'
import AuthShell, { cardClass } from '../components/AuthShell'

export default function NotFound() {
  return (
    <AuthShell>
      <div className={`${cardClass} text-center`}>
        <div className="text-5xl">🫠</div>
        <h1 className="text-2xl font-extrabold">Sayfa bulunamadı</h1>
        <p className="text-sm text-zinc-400">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link to="/" className="inline-block rounded-full bg-lime px-6 py-3 font-bold text-ink">Ana sayfaya dön</Link>
      </div>
    </AuthShell>
  )
}
