# subtracker

Dijital aboneliklerini (Netflix, Spotify, iCloud…) tek yerde takip et: aylık ve yıllık harcamanı gör, yaklaşan ödemeler için e-posta hatırlatması al.

| Klasör | İçerik |
|---|---|
| [`backend/`](backend/README.md) | Spring Boot 4 REST API (PostgreSQL, JWT + refresh cookie, Flyway) |
| [`frontend/`](frontend/README.md) | React + TypeScript + Vite + Tailwind arayüzü |

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

## Yayına alma (Render + Vercel örneği)

### Backend (Render Web Service, Docker)

1. Render'da bir **PostgreSQL** oluştur, **Internal Database URL**'den JDBC adresini hazırla (`jdbc:postgresql://HOST:5432/DB`).
2. **Web Service** → bu repo, *Root Directory:* `backend`, *Runtime:* Docker.
3. Ortam değişkenleri:

   | Değişken | Değer |
   |---|---|
   | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Render PostgreSQL bilgileri |
   | `JWT_SECRET` | `openssl rand -base64 48` çıktısı (en az 32 karakter) |
   | `CORS_ALLOWED_ORIGINS` | Frontend adresi, ör. `https://subtracker.vercel.app` (sonunda `/` olmadan) |
   | `FRONTEND_URL` | Aynı adres (e-postalardaki bağlantılar için) |
   | `COOKIE_SECURE` / `COOKIE_SAMESITE` | `true` / `None` (frontend ve API farklı sitelerdeyse) |
   | `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `MAIL_FROM` | SMTP sağlayıcın (Brevo, Resend SMTP, Mailgun…) |
   | `TZ` | `Europe/Istanbul` (hatırlatmalar sunucu saatiyle 09:00'da gider) |

4. Sağlık kontrolü yolu: `/actuator/health`.

> Render ücretsiz planı boşta uyur; uyurken gece görevleri (tarih ilerletme, hatırlatma) çalışmaz. Hatırlatmaların güvenilir olması için sürekli açık bir plan kullan.

### Önemli: cookie ve alan adı

Frontend `*.vercel.app`, API `*.onrender.com` ise tarayıcı için **farklı site**'dir; oturum cookie'si üçüncü taraf cookie sayılır. Chrome'da çalışır, Safari ve bazı gizlilik ayarlarında engellenir ve sayfa yenilenince oturum düşer. Kalıcı çözüm: kendi alan adının iki alt alan adını kullan (`app.ornek.com` → Vercel, `api.ornek.com` → Render) ve `COOKIE_SAMESITE=Lax` yap.
