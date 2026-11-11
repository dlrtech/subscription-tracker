import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

const chips = [
  { t: '🎬 Netflix', c: 'bg-pink/20 text-pink', pos: 'left-[4%] top-[8%]', r: '-6deg' },
  { t: '🎧 Spotify', c: 'bg-lime/20 text-lime', pos: 'right-[6%] top-[2%]', r: '5deg' },
  { t: '▶️ YouTube Premium', c: 'bg-violet/25 text-violet', pos: 'left-[0%] bottom-[18%]', r: '4deg' },
  { t: '☁️ iCloud', c: 'bg-sky/20 text-sky', pos: 'right-[0%] bottom-[8%]', r: '-5deg' },
]

const steps = [
  { n: '1', t: 'Hesap aç', d: '30 saniye. Kredi kartı yok, kafa karışıklığı yok.' },
  { n: '2', t: 'Abonelikleri ekle', d: 'Netflix, Spotify, spor salonu… ne varsa listele.' },
  { n: '3', t: 'Gerçeği gör', d: 'Her ay ve yıl ne kadar yaktığını, kime ne ödediğini gör.' },
]

const features = [
  { i: '⏰', t: 'Sürpriz fatura yok', d: 'Önümüzdeki günlerde hangi ödeme geliyor, tek bakışta gör.' },
  { i: '📊', t: 'Aylık & yıllık toplam', d: '"Ayda 40 TL zaten" diyorsun ama yılda ne tutuyor, bak.' },
  { i: '🏷️', t: 'Kategori kategori', d: 'Eğlence mi, müzik mi, yazılım mı? Paran nereye gidiyor anla.' },
  { i: '🌍', t: 'Her para birimi', d: 'TRY, USD, EUR… yabancı abonelikler de burada.' },
  { i: '🔒', t: 'Verin sende', d: 'Şifren şifreli saklanır, hesabını istediğin an silebilirsin.' },
  { i: '📱', t: 'Telefonda rahat', d: 'Otobüste de, derste de. Cebinde kullanmak için tasarlandı.' },
]

const faqs = [
  { q: 'Ücretsiz mi?', a: 'Evet, şu an tamamen ücretsiz.' },
  { q: 'Kart bilgilerimi istiyor mu?', a: 'Hayır. Sadece abonelik adı, tutar ve tarih giriyorsun; ödeme yapmıyoruz.' },
  { q: 'Aboneliği benim yerime iptal eder mi?', a: 'Hayır, ama neyi iptal etmen gerektiğini net görmeni sağlar.' },
  { q: 'Verilerimi silebilir miyim?', a: 'Evet. Profil sayfasından hesabını tek tıkla kalıcı olarak silebilirsin.' },
]

export default function Landing() {
  const { user } = useAuth()
  const cta = user ? { to: '/app', label: 'Uygulamaya git' } : { to: '/kayit', label: 'Ücretsiz başla' }

  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="text-xl font-extrabold tracking-tight">sub<span className="gradient-text">tracker</span></span>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {!user && <Link to="/giris" className="rounded-full px-4 py-2 text-zinc-300 hover:text-white">Giriş</Link>}
          <Link to={cta.to} className="rounded-full bg-white px-4 py-2 text-ink">{user ? 'Uygulama' : 'Kayıt ol'}</Link>
        </div>
      </header>

      <section className="glow">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-4 inline-block rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold text-lime">💸 Abonelik kaosuna son</p>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Aylık kaç TL'yi <span className="gradient-text">abonelikle yakıyorsun?</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-zinc-300">
              Netflix, Spotify, YouTube Premium, iCloud… hepsi küçük küçük çekiliyor ve ay sonunda "paramın gittiği yer" belli değil. Hepsini tek yerde topla, gerçek rakamı gör.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={cta.to} className="rounded-full bg-lime px-7 py-4 text-lg font-extrabold text-ink transition hover:scale-105">{cta.label} →</Link>
              <a href="#nasil" className="rounded-full border border-line px-6 py-4 font-semibold text-zinc-200 hover:border-zinc-500">Nasıl çalışır?</a>
            </div>
            <p className="mt-4 text-sm text-zinc-500">Kart bilgisi yok · 30 saniyede kurulum</p>
          </div>

          <div className="relative mx-auto h-[420px] w-full max-w-sm">
            {chips.map(c => (
              <span key={c.t} style={{ ['--r' as string]: c.r }} className={`floaty absolute ${c.pos} ${c.c} rounded-full px-4 py-2 text-sm font-bold shadow-lg`}>{c.t}</span>
            ))}
            <div className="absolute inset-x-4 top-12 rounded-3xl border border-line bg-panel p-5 shadow-2xl">
              <p className="text-xs text-zinc-400">Bu ay yaktığın</p>
              <p className="gradient-text text-4xl font-black">₺1.249,90</p>
              <div className="mt-4 space-y-3 text-sm">
                {[['🎬 Eğlence', '70%', 'from-violet to-pink'], ['🎧 Müzik', '45%', 'from-pink to-lime'], ['☁️ Bulut', '20%', 'from-sky to-violet']].map(([l, w, g]) => (
                  <div key={l}>
                    <div className="mb-1 flex justify-between"><span>{l}</span></div>
                    <div className="h-2 rounded-full bg-ink"><div className={`h-full rounded-full bg-gradient-to-r ${g}`} style={{ width: w }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink px-4 py-3">
                <span>⏰ Spotify</span><span className="font-bold text-lime">Yarın · ₺59,99</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-panel/40 py-5">
        <p className="mx-auto max-w-6xl px-5 text-center text-sm text-zinc-400">
          Ortalama bir genç <b className="text-white">5+ abonelik</b> kullanıyor ve çoğunun toplamını bilmiyor. Sen bileceksin. 😎
        </p>
      </section>

      <section id="nasil" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-black sm:text-4xl">3 adımda <span className="gradient-text">netlik</span></h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(s => (
            <div key={s.n} className="rounded-3xl border border-line bg-panel p-6">
              <span className="grid size-10 place-items-center rounded-full bg-lime text-lg font-black text-ink">{s.n}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-1 text-zinc-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-3xl font-black sm:text-4xl">Neden <span className="gradient-text">subtracker?</span></h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.t} className="rounded-3xl border border-line bg-panel p-6 transition hover:-translate-y-1 hover:border-violet">
              <div className="text-3xl">{f.i}</div>
              <h3 className="mt-3 text-lg font-bold">{f.t}</h3>
              <p className="mt-1 text-zinc-400">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-3xl font-black sm:text-4xl">Sık sorulanlar</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(f => (
            <details key={f.q} className="group rounded-2xl border border-line bg-panel px-5 py-4">
              <summary className="cursor-pointer list-none font-bold">{f.q}</summary>
              <p className="mt-2 text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-violet via-pink to-[#ffb86b] p-10 text-center sm:p-14">
          <h2 className="text-3xl font-black sm:text-5xl">Paranın nereye gittiğini öğrenmeye hazır mısın?</h2>
          <Link to={cta.to} className="mt-8 inline-block rounded-full bg-ink px-8 py-4 text-lg font-extrabold text-white transition hover:scale-105">{cta.label} →</Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} subtracker · Gençler için, abonelik sürprizlerine karşı. 💜
      </footer>
    </div>
  )
}
