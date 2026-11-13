# subtracker

Dijital aboneliklerini (Netflix, Spotify, iCloud…) tek yerde takip et: aylık ve yıllık harcamanı gör, yaklaşan ödemeler için e-posta hatırlatması al.

| Klasör | İçerik |
|---|---|
| [`backend/`](backend/README.md) | Spring Boot 4 REST API (PostgreSQL, JWT + refresh cookie, Flyway) |
| [`frontend/`](frontend/README.md) | React + TypeScript + Vite + Tailwind arayüzü |

## Özellikler

- Hesap, giriş, e-posta doğrulama, "şifremi unuttum" ve hesabı kalıcı silme
- Abonelik ekleme, düzenleme, durdurma, silme; arama, filtre, sıralama, sayfalama
- Her aboneliği kendi para biriminde girme; toplamı seçtiğin para biriminde görme (günlük ECB kurları)
- Aylık / yıllık toplam, kategori dağılımı, yaklaşan ödemeler ve e-posta hatırlatması
- **Pırıl:** Panelde harcamana göre tepki veren (sevinen, şaşıran, endişelenen) ve tavsiye veren kanarya karakteri. İstersen aylık bütçe belirlersin; bütçe yalnızca tarayıcıda saklanır
- Gizlilik metni (`/gizlilik`)
- Erişilebilirlik: klavye ile kullanım, görünür odak, okunur kontrast, hareket azaltma desteği

## Yerelde çalıştırma

1. **Backend** (JDK 17+, PostgreSQL): [`backend/README.md`](backend/README.md) içindeki "Yerel geliştirme" adımları. SMTP tanımlamazsan doğrulama / şifre sıfırlama bağlantıları backend konsoluna yazılır.
2. **Frontend** (Node 22+):
   ```bash
   cd frontend
   cp .env.example .env     # VITE_API_URL=http://localhost:8080
   npm ci
   npm run dev              # http://localhost:5173
   ```

Yerel `http` için backend'de `COOKIE_SECURE=false` ve `COOKIE_SAMESITE=Lax` kullan (`application-local.properties.example` bunu içerir).

## Testler

```bash
cd backend  && ./mvnw test     # H2 ile, PostgreSQL gerekmez
cd frontend && npm run lint && npm test && npm run build
```

Aynı kontroller her push ve pull request'te GitHub Actions ile çalışır (`.github/workflows/ci.yml`).

## Yayına alma (Render + Neon örneği)

Üç parça var: veritabanı (Neon), backend (Render Web Service) ve frontend (Render Static Site). Önce veritabanını, sonra backend'i, en son frontend'i kur; çünkü frontend backend'in adresini, backend de frontend'in adresini bilmek zorunda.

### 1. Veritabanı (Neon, ücretsiz)

[neon.tech](https://neon.tech)'te proje aç. Bağlantı bilgilerinden şunları hazırla:

- `DB_URL`: `jdbc:postgresql://<HOST>/<DB>?sslmode=require` (Neon'un verdiği `postgresql://kullanici:sifre@...` adresi **değil**, JDBC biçimi)
- `DB_USERNAME` ve `DB_PASSWORD`: ayrı ayrı

Tablolar backend ilk açıldığında Flyway ile otomatik oluşur. Kayıtlı kullanıcıları görmek için Neon panelinde **SQL Editor** kullanabilirsin (ör. `select id, email, name, created_at from users;`).

### 2. Backend (Render Web Service, Docker)

1. **Web Service** → bu repo, *Root Directory:* `backend`, *Runtime:* Docker.
2. Ortam değişkenleri:

   | Değişken | Değer |
   |---|---|
   | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Neon bilgileri |
   | `JWT_SECRET` | `openssl rand -base64 48` çıktısı (en az 32 karakter) |
   | `CORS_ALLOWED_ORIGINS` | Frontend adresi, ör. `https://subtracker.onrender.com` (sonunda `/` olmadan, tam eşleşmeli) |
   | `FRONTEND_URL` | Aynı adres (e-postalardaki bağlantılar için) |
   | `COOKIE_SECURE` / `COOKIE_SAMESITE` | `true` / `None` (frontend ve API farklı sitelerdeyse) |
   | `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `MAIL_FROM` | SMTP sağlayıcın (aşağıdaki nota bak) |
   | `TZ` | `Europe/Istanbul` (hatırlatmalar sunucu saatiyle 09:00'da gider) |

3. Sağlık kontrolü yolu: `/actuator/health`.
4. Render servisin **gerçek adresini** (ör. `https://subscription-tracker-xxxx.onrender.com`) panelde servis sayfasının üstünde gösterir. Frontend'e bu adresi vereceksin; ad sonunda rastgele ek olabilir.

> **E-posta (SMTP) notu:** Render ücretsiz planı giden SMTP için 25, 465 ve 587 numaralı portları engeller. Brevo gibi **2525** portunu destekleyen bir sağlayıcı seç ve `SPRING_MAIL_PORT=2525` yap. Gönderen adresi sağlayıcıda doğrulanmış olmalı (`MAIL_FROM` ile aynı). `@gmail.com` gibi ücretsiz posta adresinden gönderilen e-postalar çoğu zaman spam'e düşer ya da hiç teslim edilmez; güvenilir teslimat için kendi alan adını sağlayıcıda doğrula.

> **Uyku notu:** Render ücretsiz planı 15 dakika istek gelmezse backend'i uyutur; ilk istek uyanana kadar 1–2 dakika sürer. Arayüz bunu fark edip "Sunucu uyanıyor" mesajı gösterir ve sayfa açılır açılmaz sunucuyu uyandırmaya çalışır. Uyutmamak için bir izleme servisi (ör. UptimeRobot) ile `https://<backend-adresin>/actuator/health` adresini 5 dakikada bir yoklat. Uyurken gece görevleri (tarih ilerletme, hatırlatma) çalışmaz; hatırlatmaların güvenilir olması için sürekli açık bir plan kullan.

> **Bellek notu:** 512 MB'lık örneğe sığması için `backend/Dockerfile` JVM'i küçük bir bellekle (`-Xmx256m`) başlatır, veritabanı havuzu da varsayılan 5 bağlantıdır (`DB_POOL_SIZE`). Daha büyük bir plana geçersen bunları artırabilirsin.

### 3. Frontend (Render Static Site)

1. **Static Site** → bu repo, *Root Directory:* `frontend`.
2. *Build Command:* `npm ci && npm run build`, *Publish Directory:* `dist`.
3. Ortam değişkeni (derleme sırasında koda gömülür):

   | Değişken | Değer |
   |---|---|
   | `VITE_API_URL` | Backend'in **tam** adresi, sonunda `/` olmadan |
   | `VITE_CONTACT_EMAIL` | İsteğe bağlı. Gizlilik sayfasında gösterilecek iletişim adresi |

   `VITE_API_URL` yanlışsa ya da boşsa site `http://localhost:8080` adresini dener ve kayıt/giriş sonsuza kadar bekler. Değeri değiştirdikten sonra **Clear build cache & deploy** yap; değişken yalnızca yeniden derlemede etkili olur.
4. **Redirects/Rewrites:** `/*` → `/index.html` (rewrite). Bu olmadan `/app` ya da `/gizlilik` gibi adresler doğrudan açılınca 404 verir.
5. Frontend adresini backend'deki `CORS_ALLOWED_ORIGINS` ve `FRONTEND_URL` değişkenlerine yaz, backend'i yeniden başlat.

> Eski bir sürüm görünüyorsa tarayıcı önbelleğidir: Ctrl+F5 ya da gizli pencere dene. Açık duran sekme yeni sürümü kendiliğinden almaz.

### Önemli: cookie ve alan adı

Frontend ve API farklı alan adlarındaysa (ör. ikisi de `*.onrender.com` altında ayrı servisler, ya da `*.vercel.app` ile `*.onrender.com`) tarayıcı için **farklı site**'dir; oturum cookie'si üçüncü taraf cookie sayılır. Chrome'da çalışır, Safari ve bazı gizlilik ayarlarında engellenir ve sayfa yenilenince oturum düşer. Kalıcı çözüm: kendi alan adının iki alt alan adını kullan (`app.ornek.com` → frontend, `api.ornek.com` → backend) ve `COOKIE_SAMESITE=Lax` yap.
