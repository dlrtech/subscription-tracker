# Subscription Tracker API

Dijital aboneliklerinizi (Netflix, Spotify, bulut depolama, yazılım lisansları...) tek yerden takip etmenizi sağlayan REST API.

- Hesap oluşturma ve JWT ile giriş
- Abonelik ekleme, güncelleme, duraklatma ve silme
- Yaklaşan ödemeler listesi
- Para birimi ve kategori bazında aylık / yıllık harcama özeti
- Ödeme tarihi geçen aboneliklerin bir sonraki ödeme tarihine otomatik ilerletilmesi

**Teknolojiler:** Java 17, Spring Boot 4, Spring Security (JWT), Spring Data JPA, PostgreSQL, Flyway, springdoc-openapi.

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
| `DB_URL` | JDBC bağlantı adresi | `jdbc:postgresql://localhost:5432/subscription_tracker` |
| `DB_USERNAME` / `DB_PASSWORD` | Veritabanı kullanıcısı | `postgres` / — |
| `JWT_SECRET` | Token imzalama anahtarı, **en az 32 karakter, zorunlu** | — |
| `JWT_EXPIRATION` | Token geçerlilik süresi (ISO-8601) | `PT24H` |
| `CORS_ALLOWED_ORIGINS` | Frontend adresleri (virgülle ayrılmış) | `http://localhost:3000,http://localhost:5173` |
| `DEFAULT_CURRENCY` | Para birimi verilmeyen aboneliklerde kullanılır | `TRY` |

Güvenli bir anahtar üretmek için: `openssl rand -base64 48`

## API

Etkileşimli dokümantasyon: `http://localhost:8080/swagger-ui.html` (OpenAPI JSON: `/v3/api-docs`).

`/api/auth/**` dışındaki tüm uç noktalar `Authorization: Bearer <token>` başlığı ister.

### Kimlik doğrulama

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/register` | `{"email","password","name"}` → token + kullanıcı (201) |
| POST | `/api/auth/login` | `{"email","password"}` → token |

### Hesap

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/users/me` | Profil bilgisi |
| PUT | `/api/users/me` | `{"name"}` ile isim güncelleme |
| PUT | `/api/users/me/password` | `{"currentPassword","newPassword"}` (204) |
| DELETE | `/api/users/me` | Hesabı ve tüm abonelikleri siler (204) |

### Abonelikler

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/subscriptions` | Abonelik ekler (201) |
| GET | `/api/subscriptions?active=true` | Abonelikleri ödeme tarihine göre sıralı listeler; `active` isteğe bağlı filtredir |
| GET | `/api/subscriptions/{id}` | Tek abonelik |
| PUT | `/api/subscriptions/{id}` | Günceller |
| DELETE | `/api/subscriptions/{id}` | Siler (204) |
| GET | `/api/subscriptions/upcoming?days=7` | Önümüzdeki N gün içindeki ödemeler (0–366) |
| GET | `/api/subscriptions/summary` | Para birimi başına aylık/yıllık toplam ve kategori dağılımı |

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

`GET /actuator/health` → `{"status":"UP"}` (kimlik doğrulama gerektirmez).
