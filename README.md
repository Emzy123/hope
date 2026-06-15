# SkillBridge 🇳🇬
> Nigeria's trusted digital marketplace connecting customers with KYC-verified skilled artisans.

SkillBridge is a production-ready, full-stack service marketplace platform built for the Nigerian informal economy. Customers browse verified artisans, book services with Paystack escrow protection, communicate via in-app chat, and release payment only after confirming job completion. Workers manage bookings, track earnings, and receive SMS alerts. Admins operate a full operations centre — approvals, dispute arbitration, and an immutable audit log.

---

## 🚀 Live URLs

| Surface | URL |
|---|---|
| **Frontend (Vercel)** | `https://skillbridge-frontend.vercel.app` |
| **Backend API (Railway)** | `https://skillbridge-backend.up.railway.app` |
| **API Health Check** | `GET /api/v1/health/` |

### 🔑 Demo Credentials

> OTP bypass is active in DEBUG mode — use `123456` as the code for any phone below.

| Role | Phone | OTP | Notes |
|---|---|---|---|
| **Admin** | `08000000000` | `123456` | Full operations centre access |
| **Worker — Plumber** | `08011111111` | `123456` | Lagos, approved, top-rated |
| **Worker — Electrician** | `08022222222` | `123456` | Abuja, approved |
| **Customer 1** | `08033333333` | `123456` | Has past bookings |
| **Customer 2** | `08044444444` | `123456` | New account |

---

## 🛠️ Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend Framework** | Django 5 | Pure Django views (no DRF serializers) for lean, auditable API |
| **ODM / DB Layer** | mongoengine 0.29 | Document-Object Mapper for MongoDB |
| **Database** | MongoDB Atlas (M0) | Flexible schema; free 512 MB cluster |
| **Frontend** | Next.js 14 App Router | SSR + Client Components; deployed to Vercel |
| **Styling** | Vanilla CSS + Tailwind CSS | Utility-first, zero runtime cost |
| **Icons** | Lucide React | Consistent icon set across all portals |
| **Auth** | SimpleJWT + HTTP-only cookies | XSS-safe JWT session management |
| **Payments** | Paystack | Escrow-based checkout; HMAC-SHA512 webhook verification |
| **SMS Alerts** | Termii | Live SMS alerts for booking/escrow events (OTP is email-based via Brevo) |
| **Backend Hosting** | Railway.app | Auto-deploys from GitHub |
| **Frontend Hosting** | Vercel | Global CDN; native Next.js optimisations |

---

## 🏗️ Architecture

```
Browser (Next.js App Router — Vercel)
       │  JSON over HTTPS + HTTP-only JWT cookies
       ▼
Django API (Railway)
       ├── mongoengine ODM ──▶ MongoDB Atlas
       ├── Paystack API ──────▶ Escrow / Webhooks
       ├── Brevo Email API ───▶ Email OTP Login
       └── Termii SMS API ────▶ Booking/Escrow SMS Alerts
```

---

## 📦 Django Backend — App Map (9 apps)

| App | Responsibility |
|---|---|
| `accounts` | Email OTP auth, JWT sessions, user CRUD, admin password login |
| `workers` | Worker profiles, availability toggle, city/category metadata |
| `categories` | Service category tree; admin CRUD |
| `bookings` | Booking FSM (pending → accepted → in_progress → completed_by_worker → done / disputed / cancelled / expired) |
| `payments` | Paystack initialise + webhook; escrow ledger split (worker_amount / platform_commission) |
| `reviews` | Post-job star ratings; atomic worker average recalculation |
| `notifications` | In-app notification inbox; mark-read / mark-all-read |
| `chat` | REST-based per-booking message thread (5 s polling on frontend) |
| `admin_panel` | Dashboard stats, GlobalSettings, AuditLog, worker approvals |

---

## 🔐 Security Controls

| Control | Implementation |
|---|---|
| HTTP-only JWT cookies | Tokens never exposed to JS; XSS-safe |
| OTP throttle | 60 s cooldown + 5-attempt lockout per email |
| OTP expiry | Codes expire after 10 minutes |
| Webhook HMAC | Paystack `x-paystack-signature` validated with HMAC-SHA512 |
| RBAC decorators | `@require_auth("customer" | "worker" | "admin")` on every protected view |
| Booking FSM | Transitions validated server-side; clients cannot set arbitrary statuses |
| Worker concurrency cap | Workers limited to 3 concurrent active jobs; auto-flagged unavailable |
| Admin audit log | Every admin action (approval, arbitration, settings change) recorded immutably |
| Secrets management | All credentials in `.env`; nothing committed to Git |

---

## 🎯 Feature Matrix

### Customer Portal
- [x] Email OTP registration & login
- [x] Browse & search workers by category, city, rating
- [x] Worker public profile with live reviews & star ratings
- [x] Booking form with scheduled date & quoted amount
- [x] Paystack payment → escrow hold
- [x] Booking lifecycle — track status in real time
- [x] In-app chat with worker (5 s polling)
- [x] Release payment → trigger escrow payout
- [x] Raise dispute on a booking
- [x] Leave star review + comment after completion
- [x] In-app notification bell (10 s polling, mark-read)

### Worker Portal
- [x] View & manage incoming booking requests
- [x] Accept / reject / mark complete — FSM-gated
- [x] Active job detail with customer chat
- [x] Availability toggle (Online / Offline)
- [x] Earnings ledger — per-job gross / commission / net split
- [x] Release status badge per payout (Released / Pending)
- [x] SMS alert on new paid booking & on escrow release
- [x] In-app notification bell

### Admin Operations Centre
- [x] Dashboard — live platform stats (workers, bookings, revenue, disputes)
- [x] Worker approval queue — approve / reject with audit log
- [x] Users manager — search, role filter, toggle active status
- [x] All bookings — search, detail view, status arbitration
- [x] Disputes arbitration panel — escrow ledger, release or refund
- [x] Categories manager — create / edit / delete service categories
- [x] Platform settings — commission rate, OTP expiry, SMS templates
- [x] Audit log viewer — paginated, searchable, colour-coded by action type

---

## ⚙️ Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB Atlas account (free M0 cluster)
- Termii account (for live SMS; dev uses `123456` bypass)
- Paystack account (test keys work locally)

### Backend

```bash
# 1. Clone and enter project
git clone <repo-url> hope && cd hope

# 2. Create and activate virtualenv
python3 -m venv .venv && source .venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Configure environment variables
cp backend/.env.example backend/.env
# → Fill in MONGODB_URI, TERMII_API_KEY, PAYSTACK_SECRET_KEY, SECRET_KEY

# 5. Seed demo data
cd backend && python manage.py seed_demo

# 6. Run the API server
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# → Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

### Key `.env` Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | Full Atlas connection string |
| `SECRET_KEY` | Django secret key (generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `DEBUG` | `True` for dev (enables OTP bypass + mock payments) |
| `PAYSTACK_SECRET_KEY` | `sk_test_…` for dev, `sk_live_…` for production |
| `TERMII_API_KEY` | Termii API key (dev uses 123456 bypass when DEBUG=True) |
| `TERMII_SENDER_ID` | SMS sender label (e.g. `SkillBridge`) |
| `ALLOWED_HOSTS` | Comma-separated allowed domains |
| `CORS_ALLOWED_ORIGINS` | Frontend origin (e.g. `https://skillbridge-frontend.vercel.app`) |

---

## 📡 API Reference (Key Endpoints)

### Auth — `/api/v1/auth/`
| Method | Path | Description |
|---|---|---|
| POST | `request-otp/` | Send OTP to email |
| POST | `verify-otp/` | Verify OTP → issue JWT cookies |
| POST | `logout/` | Clear JWT cookies |
| GET/PATCH | `me/` | Get or update current user |
| POST | `admin-login/` | Password login for admin accounts |

### Workers — `/api/v1/workers/`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List approved & available workers |
| GET | `<id>/` | Worker profile detail |
| PATCH | `me/` | Update own worker profile |
| POST | `me/toggle-availability/` | Toggle online/offline |

### Bookings — `/api/v1/bookings/`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List bookings (filtered by role) |
| POST | `/` | Create booking (customer only; max 3 active jobs per worker) |
| POST | `<id>/<status>/` | Transition booking status (FSM-gated, RBAC-guarded) |

> **Booking statuses:** `pending` → `accepted` → `in_progress` → `completed_by_worker` → `done`  
> Side paths: `rejected`, `cancelled`, `disputed`, `expired` (auto after 24 h)

### Payments — `/api/v1/payments/`
| Method | Path | Description |
|---|---|---|
| POST | `initiate/` | Initialise Paystack transaction for a booking |
| POST | `simulate-success/` | Dev-only: mark payment as escrowed |
| POST | `webhook/` | Paystack webhook (HMAC-verified) |

### Reviews — `/api/v1/reviews/`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Submit review for a completed booking |
| GET | `worker/<id>/` | List all reviews for a worker |

### Notifications — `/api/v1/notifications/`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List current user's notifications |
| POST | `<id>/read/` | Mark single notification as read |
| POST | `mark-all-read/` | Mark all notifications as read |

### Chat — `/api/v1/chat/`
| Method | Path | Description |
|---|---|---|
| GET/POST | `<booking_id>/messages/` | List or send messages for a booking |

### Admin — `/api/v1/admin/`
| Method | Path | Description |
|---|---|---|
| GET | `dashboard-stats/` | Platform KPIs + recent operations log |
| GET/PATCH | `settings/` | Read or update global platform settings |
| GET | `audit-logs/` | Paginated immutable admin action history |

---

## 💡 Key Design Decisions

### Email OTP Auth with Phone Profiling
The MVP uses secure, passwordless Email OTP verification (integrated with Brevo SMTP) to eliminate password theft vectors. Users supply their phone numbers during onboarding, which are validated for Nigerian formats and utilized by the Termii SMS gateway to dispatch real-time alerts for booking and escrow payment events.

### Escrow Payment Model
Customers pay upfront; funds are held by Paystack until the customer marks the job `done`. This eliminates both "customer refuses to pay" and "worker abandons job" failure modes. The platform takes a configurable commission (default 12%) at release time.

### Worker Concurrency Cap (3 Jobs)
Workers are automatically set inactive once they hold 3 active jobs (`accepted`, `in_progress`, `completed_by_worker`, or `disputed`). They are invisible to new customers until all 3 resolve. This prevents over-commitment and protects service quality.

### Immutable Audit Log
Every admin action — worker approvals, dispute arbitrations, settings changes, user status toggles — is written to `AuditLog` in MongoDB. The log is append-only from the application layer and viewable in the Admin portal.

### Booking Auto-Expiry
Pending bookings older than 24 hours are automatically transitioned to `expired` on the next GET to the bookings list. No cron job required.

---

## 🗺️ Roadmap

- [ ] **Smile Identity NIN/BVN check** — Automated worker KYC verification
- [ ] **GPS live tracking** — Real-time worker location when job is `in_progress`
- [ ] **Push notifications** — FCM/WebPush to replace SMS for in-app events
- [ ] **WebSockets chat** — Upgrade from REST polling to Django Channels
- [ ] **Ghana expansion** — Hubtel SMS + Ghana Card + GHS currency
- [ ] **Kenya expansion** — Africa's Talking + M-Pesa STK Push + KES currency
- [ ] **i18n** — Yoruba, Igbo, Hausa, French, Swahili

---

## 📄 License

MIT License © 2026 SkillBridge Core Team
