# subtracker arayüzü

React 19 + TypeScript + Vite + Tailwind CSS v4 ile yazılmış tek sayfalık uygulama. API için [`../backend`](../backend/README.md) çalışıyor olmalı.

## Başlangıç

Gereksinim: Node 22+.

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8080
npm ci
npm run dev              # http://localhost:5173
```

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm test` | Vitest + Testing Library ile testler |
| `npm run lint` | Oxlint |
| `npm run build` | Tür kontrolü + üretim derlemesi (`dist/`) |

## Ortam değişkenleri

Derleme sırasında koda gömülür; değiştirince yeniden derlemek gerekir.

| Değişken | Açıklama |
|---|---|
| `VITE_API_URL` | Backend adresi, sonunda `/` olmadan. Boşsa `http://localhost:8080` kullanılır |
| `VITE_CONTACT_EMAIL` | İsteğe bağlı. Gizlilik sayfasındaki iletişim adresi |

## Yapı

```
src/
  api.ts              API istemcisi: bellekte access token, otomatik yenileme, hata biçimleri
  auth.tsx            Oturum durumu ve rota koruması
  advice.ts           Pırıl'ın cümleleri ve ruh hali (saf fonksiyon, testli)
  icons.ts            Abonelik adına göre simge ve renk seçimi
  components/         Icon (satır içi SVG), Mascot (Pırıl), Advisor, Backdrop, Logo, Credit, ConfirmDialog ...
  pages/              Landing, AuthPage, Dashboard, Subscriptions, Profile, Privacy, NotFound ...
```

## Tasarım notları

- **Palet:** Brevo'dan esinlenen yeşil, krem ve neredeyse siyah. Renkler `src/index.css` içindeki `@theme` bloğunda tanımlıdır. `violet` ve `pink` adları tarihsel kalıntıdır; artık açık nane ve açık kum rengini tutarlar. `*-deep` tonları açık zeminde metin için, yani yeterli kontrast içindir.
- **Simgeler:** Emoji yerine `components/Icon.tsx` içindeki satır içi SVG'ler kullanılır; ek paket gerekmez.
- **Pırıl:** `components/Mascot.tsx` beş ruh halli (mutlu, şaşkın, çok şaşkın, endişeli, düşünceli) SVG karakterdir. Ne söylediği her zaman gerçek metin olarak da ekranda görünür.
- **Hareket:** Animasyonlar azdır ve `prefers-reduced-motion` açıksa kapanır.
- **Erişilebilirlik:** Tıklanabilir öğeler en az 44 px, odak halkası her zaman görünür, kartlar opak beyazdır.

## Oturum

Access token yalnızca bellekte tutulur. Uzun ömürlü oturum, JavaScript'in okuyamadığı HttpOnly bir cookie'dedir ve sayfa yenilenince sessizce yeni access token alır. Tarayıcıda yalnızca iki küçük anahtar saklanır: `st_session` ("daha önce giriş yapıldı" ipucu) ve `st_budget` (Pırıl için aylık bütçe, sunucuya gönderilmez).

## Yayına alma

Render Static Site için adımlar kök [`README.md`](../README.md) içindedir. Kısaca: *Build Command* `npm ci && npm run build`, *Publish Directory* `dist`, `/*` → `/index.html` rewrite kuralı ve doğru `VITE_API_URL`.
