import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import Icon, { type IconName } from '../components/Icon'
import Logo from '../components/Logo'
import Mascot, { type MascotColor, type Mood } from '../components/Mascot'

const chips: { t: string; i: IconName; c: string; pos: string; r: string; dur: string }[] = [
  { t: 'Netflix', i: 'film', c: 'bg-pink', pos: 'left-[-2%] top-[6%]', r: '-6deg', dur: '6s' },
  { t: 'Spotify', i: 'headphones', c: 'bg-mint', pos: 'right-[0%] top-[0%]', r: '5deg', dur: '7s' },
  { t: 'YouTube Premium', i: 'play', c: 'bg-peach', pos: 'left-[-6%] bottom-[16%]', r: '4deg', dur: '8s' },
  { t: 'iCloud', i: 'cloud', c: 'bg-sky', pos: 'right-[-4%] bottom-[6%]', r: '-5deg', dur: '6.5s' },
]

const steps = [
  { n: '1', t: 'Hesap aç', d: '30 saniye. Kredi kartı yok, kafa karışıklığı yok.', c: 'bg-pink' },
  { n: '2', t: 'Abonelikleri ekle', d: 'Netflix, Spotify, spor salonu… ne varsa listele.', c: 'bg-mint' },
  { n: '3', t: 'Gerçeği gör', d: 'Her ay ve yıl ne kadar harcadığını, kime ne ödediğini gör.', c: 'bg-sky' },
]

const features: { i: IconName; t: string; d: string; c: string }[] = [
  { i: 'bell', t: 'Sürpriz fatura yok', d: 'Hangi ödeme ne zaman geliyor tek bakışta gör; istersen ödemeden birkaç gün önce e-postayla hatırlatırız.', c: 'bg-pink' },
  { i: 'chart', t: 'Aylık & yıllık toplam', d: '"Ayda 40 TL zaten" diyorsun ama yılda ne tutuyor, bak.', c: 'bg-violet' },
  { i: 'tag', t: 'Kategori kategori', d: 'Eğlence mi, müzik mi, yazılım mı? Paran nereye gidiyor anla.', c: 'bg-lemon' },
  { i: 'globe', t: 'Her para birimi', d: 'TRY, USD, EUR… yabancı abonelikler de burada; istersen hepsini tek para biriminde toplayıp gör.', c: 'bg-sky' },
  { i: 'lock', t: 'Verin sende', d: 'Şifren şifreli saklanır, hesabını istediğin an silebilirsin.', c: 'bg-mint' },
  { i: 'smartphone', t: 'Telefonda rahat', d: 'Otobüste de, derste de. Cebinde kullanmak için tasarlandı.', c: 'bg-peach' },
]

const reactions: { mood: Mood; color: MascotColor; t: string; say: string }[] = [
  { mood: 'happy', color: 'mint', t: 'Bütçenin altındasın', say: 'Harika! Bütçenin sadece %40\'ını kullanıyorsun.' },
  { mood: 'surprised', color: 'sky', t: 'Bir kategori her şeyi yiyor', say: 'Paranın %70\'i tek bir kategoriye gidiyor!' },
  { mood: 'worried', color: 'peach', t: 'Limite yaklaştın', say: 'Bütçenin %93\'üne geldin. İki kez düşün.' },
  { mood: 'shocked', color: 'pink', t: 'Bütçeyi aştın', say: 'Vay! Bütçeni 350 ₺ aştın. Neyi iptal edersin?' },
]

const mockRows: { l: string; i: IconName; w: string; g: string }[] = [
  { l: 'Eğlence', i: 'film', w: '70%', g: 'from-violet to-pink' },
  { l: 'Müzik', i: 'headphones', w: '45%', g: 'from-pink to-peach' },
  { l: 'Bulut', i: 'cloud', w: '20%', g: 'from-sky to-violet' },
]

const faqs = [
  { q: 'Ücretsiz mi?', a: 'Evet, şu an tamamen ücretsiz.' },
  { q: 'Kart bilgilerimi istiyor mu?', a: 'Hayır. Sadece abonelik adı, tutar ve tarih giriyorsun; ödeme yapmıyoruz.' },
  { q: 'Ödeme hatırlatması nasıl çalışıyor?', a: 'E-postanı doğruladıktan sonra, seçtiğin kadar gün önce (1–14) yaklaşan ödemelerin için tek bir e-posta alırsın. Profil sayfasından kapatabilirsin.' },
  { q: 'Aboneliği benim yerime iptal eder mi?', a: 'Hayır, ama neyi iptal etmen gerektiğini net görmeni sağlar.' },
  { q: 'Verilerimi silebilir miyim?', a: 'Evet. Profil sayfasından hesabını tek tıkla kalıcı olarak silebilirsin.' },
]

export default function Landing() {
  const { user } = useAuth()
  const cta = user ? { to: '/app', label: 'Uygulamaya git' } : { to: '/kayit', label: 'Ücretsiz başla' }
  const year = new Date().getFullYear()

  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="text-xl"><Logo size="lg" /></span>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {!user && <Link to="/giris" className="inline-flex min-h-11 items-center rounded-full px-4 muted hover:text-ink">Giriş</Link>}
          <Link to={cta.to} className="btn btn-dark !py-2">{user ? 'Uygulama' : 'Kayıt ol'}</Link>
        </div>
      </header>

      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-20">
          <div>
            <p className="pop mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-violet-deep"><Icon name="sparkles" className="size-3.5" />Abonelik kaosuna son</p>
            <h1 className="rise text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Aylık kaç TL'yi <span className="gradient-text">abonelikle harcıyorsun?</span>
            </h1>
            <p className="rise mt-5 max-w-lg text-lg muted" style={{ ['--d' as string]: '0.1s' }}>
              Netflix, Spotify, YouTube Premium, iCloud… hepsi küçük küçük çekiliyor ve ay sonunda "paramın gittiği yer" belli değil. Hepsini tek yerde topla, gerçek rakamı gör.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '0.2s' }}>
              <Link to={cta.to} className="btn btn-primary !px-7 !py-4 text-lg">{cta.label}<Icon name="arrowRight" className="size-5" /></Link>
              <a href="#nasil" className="btn btn-ghost !py-4">Nasıl çalışır?</a>
            </div>
            <p className="mt-4 text-sm muted">Kart bilgisi yok · 30 saniyede kurulum</p>
          </div>

          <div className="relative mx-auto h-[430px] w-full max-w-sm">
            {chips.map(c => (
              <span key={c.t} style={{ ['--r' as string]: c.r, ['--dur' as string]: c.dur }}
                className={`absolute z-10 ${c.pos} ${c.c} inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold shadow-lg`}>
                <Icon name={c.i} className="size-4" />{c.t}
              </span>
            ))}
            <div className="card pop absolute inset-x-4 top-12 p-5" style={{ ['--d' as string]: '0.25s' }}>
              <p className="text-xs muted">Bu ay harcadığın</p>
              <p className="gradient-text text-4xl font-black">₺1.249,90</p>
              <div className="mt-4 space-y-3 text-sm">
                {mockRows.map((r, i) => (
                  <div key={r.l}>
                    <div className="mb-1 flex items-center gap-1.5 font-semibold"><Icon name={r.i} className="size-4" />{r.l}</div>
                    <div className="h-2.5 rounded-full bg-line"><div className={`bar-grow h-full rounded-full bg-gradient-to-r ${r.g}`} style={{ width: r.w, ['--d' as string]: `${0.5 + i * 0.15}s` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-mint/60 px-4 py-3">
                <span className="flex items-center gap-2 font-semibold"><span aria-hidden="true" className="grid size-8 place-items-center rounded-xl bg-mint"><Icon name="headphones" className="size-4" /></span>Spotify</span>
                <span className="font-extrabold text-mint-deep">Yarın · ₺59,99</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-5">
        <p className="mx-auto max-w-6xl px-5 text-center text-sm muted">
          Ortalama bir genç <b className="text-ink">5+ abonelik</b> kullanıyor ve çoğunun toplamını bilmiyor. Sen bileceksin.
        </p>
      </section>

      <section id="nasil" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-black sm:text-4xl">3 adımda <span className="gradient-text">netlik</span></h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(s => (
            <div key={s.n} className="card card-hover p-6">
              <span className={`${s.c} grid size-11 place-items-center rounded-2xl text-lg font-black shadow-sm`}>{s.n}</span>
              <h3 className="mt-4 text-xl font-extrabold">{s.t}</h3>
              <p className="mt-1 muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-3xl font-black sm:text-4xl">Pırıl harcamana <span className="gradient-text">tepki verir</span></h2>
        <p className="mt-3 max-w-2xl text-lg muted">Küçük arkadaşın Pırıl, giderlerine göz kulak olur: sevinir, şaşırır, endişelenir ve sana ne yapman gerektiğini söyler.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reactions.map((r, i) => (
            <div key={r.mood} className="card card-hover group flex flex-col items-center p-5 text-center rise" style={{ ['--d' as string]: `${i * 0.08}s` }}>
              <Mascot mood={r.mood} color={r.color} waving={r.mood === 'happy'}
                className="size-28 transition-transform group-hover:[animation:hop_0.6s_ease]" />
              <h3 className="mt-3 font-extrabold">{r.t}</h3>
              <p className="bubble mt-3 text-sm font-semibold">{r.say}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-3xl font-black sm:text-4xl">Neden <span className="gradient-text">subtracker?</span></h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.t} className="card card-hover p-6">
              <div aria-hidden="true" className={`${f.c} grid size-12 place-items-center rounded-2xl text-ink shadow-sm`}><Icon name={f.i} className="size-6" /></div>
              <h3 className="mt-3 text-lg font-extrabold">{f.t}</h3>
              <p className="mt-1 muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-3xl font-black sm:text-4xl">Sık sorulanlar</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(f => (
            <details key={f.q} className="card group px-5 py-4 open:shadow-lg">
              <summary className="cursor-pointer list-none font-extrabold">{f.q}</summary>
              <p className="mt-2 muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-violet via-pink to-peach p-10 text-center shadow-xl sm:p-14">
          <div className="mb-4 flex items-end justify-center gap-2">
            <Mascot mood="happy" color="mint" className="size-20" />
            <Mascot mood="happy" color="lemon" waving className="size-24" />
            <Mascot mood="happy" color="sky" className="size-20" />
          </div>
          <h2 className="text-3xl font-black sm:text-5xl">Paranın nereye gittiğini öğrenmeye hazır mısın?</h2>
          <Link to={cta.to} className="btn btn-dark mt-8 !px-8 !py-4 text-lg">{cta.label}<Icon name="arrowRight" className="size-5" /></Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm muted">
        © {year} subtracker · Gençler için, abonelik sürprizlerine karşı.
      </footer>
    </div>
  )
}
