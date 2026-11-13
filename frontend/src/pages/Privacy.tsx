import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Credit from '../components/Credit'
import Logo from '../components/Logo'

// Optional: set VITE_CONTACT_EMAIL at build time to show a contact address on this page.
const CONTACT = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim()
const UPDATED = '13 Kasım 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" aria-label="subtracker ana sayfa" className="mb-6 inline-flex text-xl"><Logo size="lg" /></Link>

      <article className="card space-y-7 p-6 text-[0.95rem] leading-relaxed sm:p-9 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        <header className="space-y-2">
          <h1 className="text-3xl font-black">Gizlilik Metni</h1>
          <p className="text-sm muted">Son güncelleme: {UPDATED}</p>
          <p>
            subtracker, aboneliklerini tek yerde takip etmeni sağlayan küçük bir uygulamadır. Bu sayfada hangi bilgilerini
            neden sakladığımızı, kimlerin işlediğini ve verilerini nasıl silebileceğini anlatıyoruz.
          </p>
        </header>

        <Section title="Kısaca">
          <ul>
            <li>Sadece uygulamanın çalışması için gereken bilgileri saklarız.</li>
            <li>Kart numarası ya da banka bilgisi istemeyiz. Ödeme yapmayız.</li>
            <li>Verilerini satmaz, reklam için kullanmaz ve üçüncü kişilerle paylaşmayız.</li>
            <li>Hesabını Profil sayfasından istediğin an, tek tıkla ve kalıcı olarak silebilirsin.</li>
          </ul>
        </Section>

        <Section title="Hangi verileri saklıyoruz?">
          <ul>
            <li><b>Hesap bilgilerin:</b> adın, e-posta adresin ve şifren. Şifren düz metin olarak saklanmaz, geri döndürülemeyen şifreli bir özet olarak tutulur. Biz de göremeyiz.</li>
            <li><b>Girdiğin abonelikler:</b> abonelik adı, tutar, para birimi, ödeme dönemi, kategori, sonraki ödeme tarihi ve aktif olup olmadığı.</li>
            <li><b>Tercihlerin:</b> toplamları görmek istediğin para birimi, hatırlatma ayarların ve e-postanı doğrulayıp doğrulamadığın.</li>
            <li><b>Oturum bilgisi:</b> giriş yapmış kalman için tutulan, süresi dolan ve tek kullanımlık şifreli anahtarlar.</li>
            <li><b>Teknik kayıtlar:</b> sunucu barındırma hizmeti, güvenlik ve hata ayıklama için istek kayıtları (IP adresi gibi) tutabilir. Aşırı deneme yapılmasını engellemek için giriş ve kayıt isteklerinin sayısı kısa süre bellekte izlenir.</li>
          </ul>
        </Section>

        <Section title="Bu verileri ne için kullanıyoruz?">
          <ul>
            <li>Hesabını oluşturmak ve giriş yapmanı sağlamak.</li>
            <li>Aboneliklerini listelemek, aylık ve yıllık toplamları hesaplamak.</li>
            <li>E-posta adresini doğrulamak, şifreni sıfırlamak ve istersen yaklaşan ödemeler için hatırlatma e-postası göndermek. Hatırlatmaları Profil sayfasından kapatabilirsin.</li>
          </ul>
        </Section>

        <Section title="Çerezler ve tarayıcı depolaması">
          <ul>
            <li><b>st_refresh (çerez):</b> giriş yapmış kalmanı sağlar. Sayfadaki kodlar bu çereze erişemez (HttpOnly), süresi dolunca silinir.</li>
            <li><b>st_session (tarayıcı deposu):</b> sadece "daha önce giriş yaptım" bilgisini tutur. İçinde kişisel bilgi yoktur.</li>
            <li><b>st_budget (tarayıcı deposu):</b> Özet sayfasında girdiğin aylık bütçeyi bu cihazda saklar. Sunucuya gönderilmez.</li>
          </ul>
          <p>Reklam, analiz ya da takip çerezi kullanmıyoruz.</p>
        </Section>

        <Section title="Verileri ne kadar süre saklıyoruz?">
          <ul>
            <li>Hesap ve abonelik verilerin, hesabını silene kadar saklanır.</li>
            <li>Hesabını sildiğinde hesabın, tüm abonelikların ve oturum anahtarların veritabanından kalıcı olarak silinir.</li>
            <li>Oturum anahtarları 30 gün, doğrulama bağlantıları 2 gün, şifre sıfırlama bağlantıları 1 saat sonra geçersiz olur.</li>
            <li>Barındırma ve e-posta hizmetlerinin kendi kayıtları, kendi politikalarına göre bir süre daha tutulabilir.</li>
          </ul>
        </Section>

        <Section title="Haklarının nasıl kullanılacağı">
          <p>Kişisel verilerinle ilgili şu haklara sahipsin: hangi verilerinin işlendiğini öğrenme, yanlış bilgiyi düzeltme, verilerinin silinmesini isteme ve işlemeye itiraz etme.</p>
          <ul>
            <li><b>Düzeltme:</b> adını, tercihlerini ve aboneliklerini uygulama içinden istediğin zaman değiştirebilirsin.</li>
            <li><b>Silme:</b> Profil → "Hesabı sil" ile tüm verilerini kalıcı olarak silebilirsin.</li>
            <li><b>Diğer talepler:</b> verilerinin bir kopyasını ya da başka bir isteğini aşağıdaki iletişim bilgisiyle bize iletebilirsin.</li>
          </ul>
        </Section>

        <Section title="Güvenlik">
          <p>
            Bağlantılar şifreli (HTTPS) yapılır, şifreler geri döndürülemeyen biçimde saklanır, giriş ve şifre sıfırlama istekleri
            sınırlandırılır. Hiçbir sistem tamamen risksiz değildir. Bu yüzden başka sitelerde kullandığın bir şifreyi burada kullanmamanı öneririz.
          </p>
        </Section>

        <Section title="İletişim">
          {CONTACT
            ? <p>Sorularını ve taleplerini <a className="font-bold text-violet-deep underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> adresine gönderebilirsin.</p>
            : <p>Sorularını ve taleplerini bu siteyi sana ileten kişiye, yani site sahibine iletebilirsin.</p>}
        </Section>

        <Section title="Değişiklikler">
          <p>Bu metni zaman zaman güncelleyebiliriz. Güncel hali her zaman bu sayfada yer alır, üstteki tarih en son değişikliği gösterir.</p>
        </Section>

        <p className="border-t border-line pt-4 text-sm">
          <Link to="/" className="font-bold text-violet-deep underline">Ana sayfaya dön</Link>
        </p>
      </article>
      <Credit className="mt-6" />
    </div>
  )
}
