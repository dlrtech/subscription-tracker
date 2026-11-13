# Subscription Tracker API

Dijital aboneliklerinizi (Netflix, Spotify, bulut depolama, yazılım lisansları...) tek yerden takip etmenizi sağlayan REST API.

- Hesap oluşturma, JWT ile giriş, HttpOnly cookie'de yenilenen oturum (refresh token)
- E-posta doğrulama ve "şifremi unuttum" akışı
- Abonelik ekleme, güncelleme, duraklatma ve silme; arama, filtre, sıralama ve sayfalama
- Yaklaşan ödemeler listesi ve ödemeden önce e-posta hatırlatması
- Para birimi ve kategori bazında aylık / yıllık harcama özeti, tek para birimine çevrilmiş toplam
- Ödeme tarihi geçen aboneliklerin bir sonraki ödeme tarihine otomatik ilerletilmesi

**Teknolojiler:** Java 17, Spring Boot 4, Spring Security (JWT), Spring Data JPA, PostgreSQL, Flyway, Spring Mail, springdoc-openapi.

## Hızlı başlangıç

### Docker ile

```bash
cp .env.example .env      # DB_PASSWORD ve JWT_SECRET değerlerini doldurun
docker compose up --build
```

API `http://localhost:8080` adresinde çalışır.

### Yerel geliştirme

Gereksinimler: JDK 17+, PostgreSQL.

1. Boş bir veritabanı oluşturun: `CREATE DATABASE subscription_tracker;`
2. `application-local.properties.example` dosyasını aynı klasöre `application-local.properties` adıyla kopyalayıp değerleri doldurun (bu dosya git'e eklenmez).
3. Çalıştırın:

```bash
./mvnw spring-boot:run
```

Tablolar ilk açılışta Flyway tarafından otomatik oluşturulur (`src/main/resources/db/migration`).

## Yapılandırma

Üretimde tüm ayarlar ortam değişkenleriyle verilir:

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `DB_URL` | JDBC bağlantı adresi. Neon gibi bulut veritabanlarında `jdbc:postgresql://HOST/DB?sslmode=require` | `jdbc:postgresql://localhost:5432/subscription_tracker` |
| `DB_USERNAME` / `DB_PASSWORD` | Veritabanı kullanıcısı | `postgres` / — |
| `DB_POOL_SIZE` | Veritabanı bağlantı havuzu boyutu (küçük örnekler ve ücretsiz bulut veritabanları için 5 yeterli) | `5` |
| `JWT_SECRET` | Token imzalama anahtarı, **en az 32 karakter, zorunlu** | — |
| `JWT_EXPIRATION` | Access token geçerlilik süresi (ISO-8601) | `PT15M` |
| `REFRESH_EXPIRATION` | Refresh token (oturum) süresi | `P30D` |
| `CORS_ALLOWED_ORIGINS` | Frontend adresleri (virgülle ayrılmış) | `http://localhost:3000,http://localhost:5173` |
| `FRONTEND_URL` | E-postalardaki bağlantıların adresi | `http://localhost:5173` |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Refresh cookie ayarı, aşağıya bakın | `true` / `None` |
| `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` | SMTP sunucusu. Host boşsa e-postalar gönderilmez, **log'a yazılır**. Render ücretsiz planı 25/465/587 portlarını engeller, **2525** kullan | — / `587` |
| `MAIL_FROM` | Gönderen adresi; SMTP sağlayıcıda doğrulanmış olmalı | `subtracker <no-reply@localhost>` |
| `RATE_LIMIT_MAX_REQUESTS` / `RATE_LIMIT_WINDOW` | Giriş, kayıt, şifre sıfırlama uçlarında istemci başına istek sınırı | `10` / `PT1M` |
| `API_DOCS_ENABLED` | Swagger arayüzü ve `/v3/api-docs`. Üretimde kapalı kalmalı | `false` |
| `DEFAULT_CURRENCY` | Para birimi verilmeyen aboneliklerde kullanılır | `TRY` |
| `EXCHANGE_URL` | Kur servisi (varsayılan: ücretsiz Frankfurter / ECB, anahtar gerekmez) | `https://api.frankfurter.dev/v1/latest` |

Güvenli bir anahtar üretmek için: `openssl rand -base64 48`

## API

Etkileşimli dokümantasyon: `http://localhost:8080/swagger-ui.html` (OpenAPI JSON: `/v3/api-docs`). Tüm uç noktaları herkese gösterdiği için **varsayılan olarak kapalıdır**; yerelde `API_DOCS_ENABLED=true` (ya da `application-local.properties.example` dosyasındaki `springdoc.*` ayarları) ile açın, üretimde açmayın.

`/api/auth/**` dışındaki tüm uç noktalar `Authorization: Bearer <token>` başlığı ister.

### Kimlik doğrulama

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/register` | `{"email","password","name"}` → access token + kullanıcı (201), refresh cookie'si ve doğrulama e-postası |
| POST | `/api/auth/login` | `{"email","password"}` → access token + refresh cookie'si |
| POST | `/api/auth/refresh` | Refresh cookie'si ile yeni access token verir, cookie'yi yeniler (eskisi geçersiz olur) |
| POST | `/api/auth/logout` | Refresh token'ı iptal eder (204) |
| POST | `/api/auth/forgot-password` | `{"email"}` → adres kayıtlı olsa da olmasa da 204; kayıtlıysa 1 saat geçerli bağlantı e-postalanır |
| POST | `/api/auth/reset-password` | `{"token","newPassword"}` → şifreyi değiştirir, tüm oturumları kapatır (204) |
| POST | `/api/auth/verify-email` | `{"token"}` → e-postayı doğrular (204) |

**Oturum modeli.** Access token kısa ömürlüdür (15 dk) ve JSON yanıtında döner; frontend onu yalnızca bellekte tutar. Uzun ömürlü refresh token, JavaScript'in okuyamadığı `HttpOnly` bir cookie'dedir (`st_refresh`, yol `/api/auth`) ve her kullanımda yenilenir; veritabanında yalnızca özeti (SHA-256) saklanır. `refresh` ve `logout` çağrıları `X-Requested-With` başlığı ister; bu başlık tarayıcıda CORS ön kontrolü zorunlu kıldığı için başka siteler cookie'yi tetikleyemez.

**Cookie ayarı.** Frontend ve API **farklı sitelerdeyse** (ör. `x.vercel.app` ve `y.onrender.com`) `COOKIE_SECURE=true` ve `COOKIE_SAMESITE=None` gerekir (varsayılan). Safari ve bazı tarayıcılar üçüncü taraf cookie'lerini engellediği için oturum sayfa yenilenince düşebilir; kalıcı çözüm, ikisini aynı alan adının alt alan adlarında yayınlamaktır (`app.ornek.com`, `api.ornek.com`) ve `COOKIE_SAMESITE=Lax` yapmaktır. Yerel `http://localhost` için `COOKIE_SECURE=false`, `COOKIE_SAMESITE=Lax` kullanın.

**İstek sınırı.** Giriş, kayıt, şifre sıfırlama, doğrulama uçları istemci adresi başına dakikada 10 istekle sınırlıdır (aşılırsa 429 + `Retry-After`). Sayaç bellekte tutulur; tek örnekli dağıtım için yeterlidir. Arkada bir proxy varsa (Render, Docker) `X-Forwarded-For` başlığı kullanılır.

### Hesap

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/users/me` | Profil bilgisi (`emailVerified`, `remindersEnabled`, `reminderDays` dahil) |
| PUT | `/api/users/me` | Kısmi güncelleme: `{"name"}`, `{"remindersEnabled","reminderDays"}` (1–14) |
| PUT | `/api/users/me/password` | `{"currentPassword","newPassword"}` (204); diğer cihazlardaki oturumları kapatır |
| POST | `/api/users/me/resend-verification` | Doğrulama e-postasını yeniden gönderir (204) |
| DELETE | `/api/users/me` | Hesabı ve tüm abonelikleri siler (204) |

### Abonelikler

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/subscriptions` | Abonelik ekler (201) |
| GET | `/api/subscriptions` | Listeler. İsteğe bağlı: `active`, `q` (isimde arama), `sort` (`date`\|`name`\|`price`), `order` (`asc`\|`desc`), `page` (0'dan), `size` (1–200, varsayılan 100). Toplam kayıt sayısı `X-Total-Count` başlığında |
| GET | `/api/subscriptions/{id}` | Tek abonelik |
| PUT | `/api/subscriptions/{id}` | Günceller |
| DELETE | `/api/subscriptions/{id}` | Siler (204) |
| GET | `/api/subscriptions/upcoming?days=7` | Önümüzdeki N gün içindeki ödemeler (0–366) |
| GET | `/api/subscriptions/summary` | Para birimi başına aylık/yıllık toplam ve kategori dağılımı |
| GET | `/api/subscriptions/summary/total?currency=TRY` | Tüm para birimlerini günlük referans kurlarla (ECB) tek para birimine çevirir. Kuru bulunamayan para birimleri `unconvertedCurrencies` listesinde döner, toplama katılmaz |

Örnek abonelik isteği:

```json
{
  "name": "Netflix",
  "price": 229.99,
  "currency": "TRY",
  "billingPeriod": "MONTHLY",
  "nextBillingDate": "2026-12-05",
  "category": "ENTERTAINMENT",
  "active": true
}
```

- `billingPeriod`: `WEEKLY`, `MONTHLY`, `YEARLY`
- `category`: `ENTERTAINMENT`, `MUSIC`, `SOFTWARE`, `INTERNET`, `CLOUD`, `OTHER` (boş bırakılırsa `OTHER`)
- `currency`: 3 harfli ISO kodu (boş bırakılırsa `DEFAULT_CURRENCY`)
- `active`: boş bırakılırsa `true`

### Ödeme tarihleri

Geçmiş bir `nextBillingDate` girilirse bir sonraki ödeme günü hesaplanır. Uygulama her gece 00:05'te ve her açılışta tarihi geçen abonelikleri ilerletir. Hesaplama ilk tarihe göre yapılır, bu yüzden ay sonu tarihleri kaymaz (31 Ocak → 28 Şubat → 31 Mart).

### E-postalar ve hatırlatmalar

Doğrulama, şifre sıfırlama ve ödeme hatırlatma e-postaları SMTP ile gönderilir (`SPRING_MAIL_*`). SMTP ayarlı değilse e-posta içeriği (bağlantılar dahil) uygulama log'una yazılır; yerel geliştirmede bağlantıyı oradan kopyalayabilirsiniz. Üretimde mutlaka SMTP tanımlayın. Ücretsiz posta adresleri (`@gmail.com` gibi) gönderen olarak kullanılırsa e-postalar çoğunlukla spam'e düşer; güvenilir teslimat için kendi alan adınızı SMTP sağlayıcıda doğrulayın.

Her sabah 09:00'da (sunucu saat dilimi), e-postasını doğrulamış ve hatırlatmaları açık olan kullanıcılara, seçtikleri gün sayısı içindeki ödemeler için **tek bir e-posta** gönderilir. Aynı ödeme için ikinci kez hatırlatma yapılmaz; gönderim başarısız olursa ertesi gün yeniden denenir. Kur bilgisi için `api.frankfurter.dev` adresine yalnızca para birimi kodu gönderilir, kullanıcı verisi gönderilmez; kurlar 6 saat önbelleğe alınır.

### Hatalar

Hatalar [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) `application/problem+json` biçiminde döner:

```json
{ "status": 400, "detail": "Validation failed", "errors": { "price": "Price must be greater than zero" } }
```

| Kod | Durum |
|---|---|
| 400 | Geçersiz istek / doğrulama hatası |
| 401 | Token yok, geçersiz veya süresi dolmuş; hatalı giriş bilgisi |
| 404 | Kayıt bulunamadı (başka kullanıcıya ait kayıtlar da 404 döner) |
| 409 | E-posta zaten kayıtlı |
| 429 | Çok fazla istek (giriş, kayıt, şifre sıfırlama uçları) |

## Testler

```bash
./mvnw test
```

Testler bellek içi H2 veritabanıyla çalışır; PostgreSQL gerekmez. Aynı testleri gerçek PostgreSQL'e karşı çalıştırmak için:

```bash
./mvnw test -Dspring.datasource.url=jdbc:postgresql://localhost:5432/<bos_test_db> \
            -Dspring.datasource.username=postgres -Dspring.datasource.password=<sifre>
```

## Sağlık kontrolü

`GET /actuator/health` → `{"status":"UP"}` (kimlik doğrulama gerektirmez). Ücretsiz bir bulut planında uygulamanın uyumaması için bir izleme servisinin bu adresi düzenli yoklaması yeterlidir.

## Bellek

`Dockerfile`, 512 MB'lık küçük örneklere sığması için JVM'i `-Xmx256m`, seri çöp toplayıcı ve sınırlı metaspace ile başlatır. Daha büyük bir sunucuda bu bayrakları artırabilirsiniz.
