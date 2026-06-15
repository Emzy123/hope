
| SKILLBRIDGE<br>Full-Stack Marketplace Platform<br>Complete Development Blueprint<br> <br>Nigeria-first · Pan-African Vision · Django + MongoDB + Next.js · $0 Hosting |
| --- |


**EXECUTIVE SUMMARY**
SkillBridge is a comprehensive digital marketplace platform connecting customers with skilled workers across every service category in Nigeria, with architecture designed to expand Pan-African from day one. Built on Django REST Framework, MongoDB Atlas, and Next.js deployed on free-tier infrastructure, the platform solves Nigeria's core problem: trust, discovery, and accountability in the informal skilled-labour economy.

| 12<br>Development Phases | 9<br>Django Apps | $0/mo<br>MVP Hosting Cost | 60+<br>Service Categories |
| --- | --- | --- | --- |


**The Problem We're Solving**

| Challenge | Current Reality | SkillBridge Solution |
| --- | --- | --- |
| Fragmented Discovery | WhatsApp groups, roadside ads, word of mouth | Central searchable platform with category browse |
| No Verification | No way to check skills or reliability | Admin-approved workers + KYC-ready architecture |
| Pricing Opacity | Haggling leads to disputes and overcharging | Workers set transparent rates upfront |
| No Accountability | Poor work has no recourse | Rating system + escrow payment protection |
| Limited Worker Reach | Skilled workers depend on local networks only | Access to city-wide and national customer base |
| Payment Insecurity | Cash transactions, frequent non-payment | Paystack escrow — funds held until job complete |



**TECHNOLOGY STACK**
**Why This Stack?**
Every technology choice below is optimised for three constraints: solo developer, zero hosting budget, and a real product that can scale when funding arrives. No technology is chosen for novelty — each solves a specific problem.

| Layer | Technology | Why Chosen | Cost |
| --- | --- | --- | --- |
| Backend Framework | Django 5 + DRF | Batteries-included, Python, rapid API development | Free |
| ODM / DB Layer | mongoengine (not Djongo) | Actively maintained, clean API, works with DRF | Free |
| Database | MongoDB Atlas | Original spec, flexible schema for categories/portfolios | Free (512MB) |
| Frontend Framework | Next.js 14 (App Router) | Server-side rendering, Vercel-native, best DX | Free |
| UI Components | Tailwind CSS + shadcn/ui | World-class UI in hours, not days | Free |
| Backend Hosting | Railway.app | $5 free credit/month, GitHub auto-deploy | ~Free |
| Frontend Hosting | Vercel | Native Next.js host, global CDN, zero config | Free |
| Media Storage | Cloudinary | 25GB free tier, image transforms for worker photos | Free |
| Payments | Paystack | Nigerian market leader, great API, test mode for demo | Free (test) |
| SMS Alerts | Termii | Nigerian provider, free trial credits | Free trial |
| Real-time | Django Channels | WebSockets for chat + status updates, in-memory for demo | Free |
| Auth | SimpleJWT | Proven JWT library, HTTP-only cookie support | Free |
| Maps | Leaflet.js | Open-source maps, no API key required | Free |
| State Mgmt | Zustand + React Query | Lightweight, perfect for API-driven Next.js apps | Free |


**Why mongoengine, not Djongo?**
Djongo (the library originally specified) attempts to translate Django ORM queries into MongoDB operations. It is poorly maintained, breaks silently on Django 4.2+, and causes hours of debugging with no clear error messages. mongoengine is a purpose-built Python ODM for MongoDB that works alongside Django REST Framework cleanly. Production teams that use Django + MongoDB use mongoengine. The document model definitions look almost identical to Django models — the migration cost is minimal.

| ⚡ Critical setup note: when using mongoengine, do NOT use Django's built-in ORM or migrations for your document models. Set MIGRATION_MODULES = {} in settings.py to disable migrations for your apps. mongoengine manages the MongoDB schema directly. |
| --- |



**SYSTEM ARCHITECTURE**
**High-Level Architecture**
The platform uses a decoupled architecture: Django provides the REST API and business logic, Next.js handles the frontend (three portals: Customer, Worker, Admin), and MongoDB Atlas stores all data. Communication between frontend and backend is via JSON over HTTPS. Real-time features use WebSockets managed by Django Channels.

| Component | Technology | Responsibility |
| --- | --- | --- |
| API Server | Django + DRF on Railway | All business logic, auth, booking FSM, payment webhooks |
| Frontend — Customer | Next.js on Vercel | Service discovery, booking flow, payment redirect, reviews |
| Frontend — Worker | Next.js on Vercel | Job management, earnings dashboard, availability toggle |
| Frontend — Admin | Next.js on Vercel | Worker approvals, booking oversight, analytics, settings |
| Document Store | MongoDB Atlas | All data: users, bookings, payments, reviews, categories |
| Media CDN | Cloudinary | Worker portfolio photos, profile pictures, ID documents |
| Payment Gateway | Paystack | Transaction initiation, webhook callbacks, escrow logic |
| WebSocket Server | Django Channels (in-memory) | Real-time chat, live booking status updates |
| SMS Gateway | Termii | Booking and escrow alerts to phone numbers |


**Django App Structure**
The Django project is split into 9 focused apps, each owning a distinct domain:

| App | Responsibility | Key Models / Views |
| --- | --- | --- |
| accounts | User auth, OTP, JWT | User document, OTP store, login/refresh endpoints |
| workers | Worker profiles, verification | WorkerProfile, portfolio upload, availability |
| categories | Service category tree | Category (self-referential), pre-seeded 60+ types |
| bookings | Booking lifecycle FSM | Booking document, state machine transitions |
| payments | Paystack integration, escrow | Payment document, webhook handler, commission logic |
| reviews | Post-job ratings and comments | Review document, auto-update worker rating_avg |
| notifications | In-app + SMS alerts | Notification log, Termii SMS sender |
| chat | WebSocket real-time messaging | ChatConsumer, Message document, room management |
| admin_panel | Platform management APIs | Worker approval queue, stats, category management |



**DATA MODELS — FULL SCHEMA**
**Design Principles**
- ✓ Email is the primary auth identifier — not phone number. Passwordless Email OTP eliminates credential theft vectors. Phone numbers are verified during onboarding for SMS alerts.
- ✓ All monetary values stored in the smallest unit (kobo for NGN) to avoid floating-point rounding errors in payment calculations.
- ✓ Portfolio images are embedded inside WorkerProfile (always read together). Bookings and Payments are separate documents (queried independently by status, date, user).
- ✓ The Booking document is the central entity — all other documents reference it. The booking FSM is the core business logic of the entire platform.
- ✓ Category uses a self-referential parent field to support unlimited depth (e.g. Home Services → Plumbing → Emergency Plumbing).

**Document Schemas**
**1. User**

| Field | Type | Notes |
| --- | --- | --- |
| phone | StringField (unique) | Primary identifier, validated as Nigerian format (+234...) |
| name | StringField | Full name as entered during onboarding |
| role | StringField (enum) | CUSTOMER | WORKER | ADMIN |
| profile_photo | StringField | Cloudinary URL |
| is_verified | BooleanField | True after OTP confirmed |
| is_active | BooleanField | False = soft-deleted / banned by admin |
| created_at | DateTimeField | Auto-set on creation |
| last_login | DateTimeField | Updated on each successful auth |


**2. WorkerProfile**

| Field | Type | Notes |
| --- | --- | --- |
| user | ReferenceField(User) | One-to-one link to the User document |
| bio | StringField | Worker's self-description (max 500 chars) |
| categories | ListField(ReferenceField) | List of Category refs — worker's offered services |
| city | StringField | Current operating city (Lagos, Abuja, PH...) |
| portfolio | EmbeddedDocumentListField | List of {image_url, caption} embedded docs |
| hourly_rate | DecimalField | Rate in NGN, displayed to customers |
| rating_avg | FloatField | Auto-updated when new review is saved |
| total_jobs | IntField | Incremented when booking moves to DONE |
| is_available | BooleanField | Worker's live toggle — shown in search results |
| is_approved | BooleanField | Set True by admin after reviewing application |
| badge_tier | StringField | BASIC | VERIFIED | TOP_RATED (auto-assigned) |
| id_doc_url | StringField | Cloudinary URL of uploaded NIN/ID document |


**3. Category**

| Field | Type | Notes |
| --- | --- | --- |
| name | StringField | Display name (e.g. 'Emergency Plumber') |
| slug | StringField (unique) | URL-safe identifier (e.g. 'emergency-plumber') |
| parent | ReferenceField(self) | None = top-level. Set = subcategory |
| icon_name | StringField | Lucide icon name for UI rendering |
| is_active | BooleanField | Admin can disable categories without deleting |


**4. Booking (the FSM core)**

| Field | Type | Notes |
| --- | --- | --- |
| customer | ReferenceField(User) | The customer who created the booking |
| worker | ReferenceField(User) | The worker assigned to the job |
| category | ReferenceField(Category) | Service type booked |
| status | StringField (enum) | PENDING|ACCEPTED|IN_PROGRESS|DONE|DISPUTED|CANCELLED|EXPIRED |
| description | StringField | Customer's job description |
| address | StringField | Job location (text — no GPS required for MVP) |
| scheduled_at | DateTimeField | Customer's requested date and time |
| price_quoted | DecimalField | Worker's quoted price in NGN |
| payment_status | StringField | UNPAID | PAID | ESCROWED | RELEASED | REFUNDED |
| created_at | DateTimeField | When customer submitted the booking request |
| accepted_at | DateTimeField | When worker accepted (null until then) |
| completed_at | DateTimeField | When marked DONE — triggers escrow release |



| ⚡ Booking FSM rules enforced at serializer level: PENDING → ACCEPTED (worker only) → IN_PROGRESS (worker only) → DONE (worker only). Customer can cancel from PENDING or ACCEPTED. Disputed bookings freeze payment until admin resolves. Expired = PENDING bookings not accepted within 24 hours. Any invalid transition returns HTTP 400 with a clear error message. |
| --- |


**5. Payment**

| Field | Type | Notes |
| --- | --- | --- |
| booking | ReferenceField(Booking) | The booking this payment covers |
| amount_kobo | IntField | Total charged to customer in kobo (100 kobo = ₦1) |
| commission_kobo | IntField | Platform 12% cut — calculated on payment creation |
| worker_amount_kobo | IntField | amount_kobo minus commission_kobo |
| paystack_ref | StringField (unique) | Paystack transaction reference for webhook matching |
| status | StringField | INITIATED | PAID | FAILED | REFUNDED |
| escrow_released | BooleanField | True when booking DONE and worker payout triggered |
| created_at | DateTimeField | When payment was initiated |


**6. Review**

| Field | Type | Notes |
| --- | --- | --- |
| booking | ReferenceField(Booking, unique=True) | One review per booking — enforced by unique index |
| reviewer | ReferenceField(User) | The customer leaving the review |
| worker | ReferenceField(User) | Denormalised for fast worker profile queries |
| rating | IntField (1–5) | Star rating — validated min=1, max=5 |
| comment | StringField | Optional written review (max 1000 chars) |
| created_at | DateTimeField | Only creatable when booking.status == DONE |



**API ENDPOINTS REFERENCE**
**Authentication**

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/v1/auth/request-otp/ | Public | Send OTP to email address via Brevo |
| POST | /api/v1/auth/verify-otp/ | Public | Verify OTP, return JWT access + refresh tokens |
| POST | /api/v1/auth/refresh/ | Public | Refresh JWT access token using refresh token |
| POST | /api/v1/auth/logout/ | Any user | Blacklist refresh token, clear cookies |


**Workers & Categories**

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | /api/v1/categories/ | Public | Full category tree for the category picker |
| GET | /api/v1/workers/ | Public | List workers — filter by category, city, rating, price |
| GET | /api/v1/workers/{id}/ | Public | Worker profile detail with portfolio and reviews |
| POST | /api/v1/workers/profile/ | Worker | Create worker profile (after OTP auth) |
| PATCH | /api/v1/workers/profile/ | Worker | Update bio, categories, rates, portfolio |
| POST | /api/v1/workers/profile/portfolio/ | Worker | Upload a portfolio photo to Cloudinary |
| PATCH | /api/v1/workers/availability/ | Worker | Toggle is_available on/off |


**Bookings**

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/v1/bookings/ | Customer | Create a new booking request for a worker |
| GET | /api/v1/bookings/ | Any user | List my bookings (filtered by role automatically) |
| GET | /api/v1/bookings/{id}/ | Owner | Booking detail — customer or assigned worker |
| POST | /api/v1/bookings/{id}/accept/ | Worker | Accept booking → status ACCEPTED |
| POST | /api/v1/bookings/{id}/reject/ | Worker | Reject booking → status CANCELLED |
| POST | /api/v1/bookings/{id}/start/ | Worker | Mark job started → status IN_PROGRESS |
| POST | /api/v1/bookings/{id}/complete/ | Worker | Mark job done → status DONE, triggers escrow release |
| POST | /api/v1/bookings/{id}/cancel/ | Customer | Cancel booking (PENDING or ACCEPTED only) |
| POST | /api/v1/bookings/{id}/dispute/ | Customer | Raise dispute → status DISPUTED, freezes payment |


**Payments**

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/v1/payments/initiate/ | Customer | Create Paystack transaction, return authorization_url |
| POST | /api/v1/payments/webhook/ | Paystack | Webhook: verify HMAC signature, process charge.success |
| GET | /api/v1/payments/{booking_id}/ | Owner | Payment status and details for a specific booking |


**Reviews & Admin**

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/v1/reviews/ | Customer | Submit review (only on DONE bookings) |
| GET | /api/v1/reviews/worker/{id}/ | Public | All reviews for a specific worker |
| GET | /api/v1/admin/workers/pending/ | Admin | Queue of unapproved worker applications |
| POST | /api/v1/admin/workers/{id}/approve/ | Admin | Approve worker — sets is_approved = True |
| POST | /api/v1/admin/workers/{id}/reject/ | Admin | Reject worker with reason message |
| GET | /api/v1/admin/stats/ | Admin | Platform stats: total bookings, revenue, workers |
| PATCH | /api/v1/admin/categories/{id}/ | Admin | Enable/disable a service category |



**DEVELOPMENT PHASES — FULL PLAN**
The platform is built in 12 phases, each with a clear deliverable. Phases 1–5 are backend-first: get the full API working before touching the frontend. This avoids the common mistake of building a beautiful UI that breaks because the backend isn't ready.

| 01 | Foundation | Project Scaffold, Atlas Connection & Railway Deploy | Days 1–5 |
| --- | --- | --- | --- |


- ✓ Create Django project with 9 apps: accounts, workers, categories, bookings, payments, reviews, notifications, chat, admin_panel
- ✓ Install mongoengine, djangorestframework, djangorestframework-simplejwt, django-cors-headers, gunicorn, cloudinary
- ✓ Connect mongoengine to MongoDB Atlas free cluster — connection validated with a ping document
- ✓ Configure settings split: base.py / dev.py / prod.py — environment variables via python-decouple
- ✓ Write GET /api/v1/health/ endpoint that returns {status: ok, db: connected}
- ✓ Add Procfile (web: gunicorn config.wsgi) and deploy to Railway with auto-deploy from GitHub
- ✓ Create Next.js 14 project with Tailwind CSS + shadcn/ui — deployed to Vercel, environment variables set
- ✓ Configure CORS: Django allows only the Vercel domain — no wildcard

| ⚡ First milestone: /api/v1/health/ returns 200 from your live Railway URL — not just localhost. Do not move to Phase 2 until this works. It confirms your database connection, deployment pipeline, and environment config are all correct. |
| --- |




| 02 | Foundation | MongoDB Document Models — Full Schema | Days 6–12 |
| --- | --- | --- | --- |


- ✓ Write all 6 mongoengine documents: User, WorkerProfile, Category, Booking, Payment, Review
- ✓ Set MIGRATION_MODULES = {} in settings.py — mongoengine manages schema, not Django ORM
- ✓ Add compound indexes: Booking by (worker, status), Worker by (city, is_available, is_approved)
- ✓ Seed management command: python manage.py seed_demo — creates 1 admin, 3 workers (different categories), 2 customers, bookings in every FSM state
- ✓ Validate all documents round-trip: create, save, read back, assert fields correct

| ⚡ Schema lock point: once Phase 3 begins, changing field names requires updating serializers and views. Finalise the schema here — add any fields you know you'll need even if you don't use them yet. |
| --- |




| 03 | Backend | Authentication — Phone OTP + JWT | Days 13–18 |
| --- | --- | --- | --- |


- ✓ Custom mongoengine User backend replacing Django's default auth system
- ✓ POST /api/v1/auth/request-otp/: validates email format, stores hashed OTP in MongoDB with 10-min TTL, sends via Brevo SMTP
- ✓ POST /api/v1/auth/verify-otp/: checks code, creates User if new, returns JWT access (15min) + refresh (30 days) in HTTP-only cookies
- ✓ Three DRF permission classes: IsCustomer, IsWorker, IsAdmin — used as decorators on every protected view
- ✓ Rate limiting: max 5 OTP requests per email per hour — tracked via a counter document in MongoDB
- ✓ Dev mode: OTP printed to Django console. Hardcoded test number 08000000000 always accepts code 123456
- – *Real SMS delivery to your own number — save Termii trial credits for demo day*

| ⚠ Security note: JWT tokens stored in HTTP-only cookies are immune to JavaScript-based XSS attacks. Never store them in localStorage. The Next.js frontend sends credentials: 'include' on all fetch calls. |
| --- |




| 04 | Backend | Core APIs — Workers, Categories, Bookings, Reviews | Days 19–30 |
| --- | --- | --- | --- |


- ✓ Categories API: GET /api/v1/categories/ returns full tree. Workers API: list with filter by category slug, city, min_rating, max_price
- ✓ Worker onboarding: create profile, upload portfolio photos to Cloudinary via unsigned upload preset, set rates
- ✓ Booking FSM: all 9 state-transition endpoints implemented and validated. Invalid transitions return HTTP 400 with message
- ✓ Reviews API: POST only on DONE bookings (enforced server-side). Review save triggers atomic update of worker rating_avg
- ✓ Admin APIs: pending worker queue, approve/reject with reason, platform stats (total bookings, revenue, workers)
- ✓ All endpoints tested in Postman with real JWT tokens before moving to Phase 5

| ⚡ Build one complete flow end-to-end in Postman before writing the next endpoint: OTP → get token → create booking → accept → complete → review. Confirm every step works before moving on. This catches integration bugs early. |
| --- |




| 05 | Backend | Payments — Paystack Escrow + Webhooks | Days 31–37 |
| --- | --- | --- | --- |


- ✓ PaymentService class: initiates Paystack transaction, stores reference in Payment document, returns authorization_url
- ✓ Webhook handler at /api/v1/payments/webhook/: verifies HMAC-SHA512 signature using Paystack secret key — rejects unsigned requests with 400
- ✓ On charge.success webhook: marks booking payment_status = ESCROWED, allows worker to start job
- ✓ Escrow release: triggered when booking.status → DONE. Sets escrow_released = True, calculates 12% commission, logs worker payout amount
- ✓ Idempotency: webhook handler checks paystack_ref already processed — prevents double-processing on Paystack retries
- – *Actual bank transfer to worker account — requires live Paystack keys and real bank account. Simulated in demo.*

| ⚠ Test card for Paystack sandbox: 4084 0840 8408 4081, any future expiry, CVV 408. Generates a real charge.success webhook event to your Railway URL. Use ngrok locally to test webhooks during development. |
| --- |





| 06 | Frontend | Design System + Customer Portal | Days 38–52 |
| --- | --- | --- | --- |


- ✓ Design tokens set in tailwind.config.js: primary #1a5c38 (deep Nigerian green), accent #f5a623 (warm amber), full neutral scale
- ✓ Install shadcn/ui components: npx shadcn-ui@latest add button card input badge table select dialog — use consistently throughout
- ✓ Landing page: animated hero with real Lagos photo (Unsplash free), 12-category service grid with Lucide icons, 3-step how-it-works, worker testimonials with star ratings, CTA section
- ✓ Service browser page: category filter sidebar, worker cards grid (photo, name, rating, price/hr, city badge, book button)
- ✓ Worker profile page: cover photo, avatar, bio, category tags, portfolio masonry grid (Cloudinary images), reviews list, sticky booking sidebar
- ✓ Booking flow: date/time picker (react-day-picker), job description textarea, price summary card, Paystack redirect on confirm
- ✓ Customer dashboard: active bookings with status badge, booking history table with search, leave review modal on DONE bookings
- ✓ Auth screens: phone input → OTP 6-digit keypad → name + photo upload — 3-step wizard with progress indicator

| ⚡ The landing page is your most-viewed screen. Spend 2 full days on it. A strong hero with real Nigerian city photography, clean iconography, and compelling copy ('Book trusted workers in Lagos in under 5 minutes') makes the entire platform look funded and professional. |
| --- |




| 07 | Frontend | Worker Dashboard + Admin Panel | Days 53–63 |
| --- | --- | --- | --- |


- ✓ Worker home: stat cards (today's jobs, week earnings, overall rating, total completed), live availability toggle synced to API
- ✓ Incoming requests: booking request cards with customer name, job type, date/time, quoted price — accept and reject buttons with confirmation dialog
- ✓ Active job view: customer contact details, address shown on Leaflet.js map, mark in-progress and mark complete action buttons
- ✓ Worker profile editor: bio textarea, category multi-select, portfolio manager (add/remove photos), hourly rate input
- ✓ Admin panel — worker approval queue: card showing worker photo, name, services offered, ID document preview, approve/reject with reason
- ✓ Admin panel — bookings table: all bookings with search, filter by status/date, view detail, resolve dispute action
- ✓ Admin panel — dashboard: stat row (total workers, total bookings, platform revenue, active disputes), bookings-over-time chart (recharts)
- ✓ Admin panel — category manager: tree view of all categories, enable/disable toggle, add subcategory form

| ⚡ The admin approval queue is your highest-impact UI for assessors. A side-by-side panel (worker info and uploaded ID on left, approve/reject buttons with reason field on right) looks like real operations software. Prioritise this screen. |
| --- |




| 08 | Security | Real-time Chat, Security Hardening & Notifications | Days 64–70 |
| --- | --- | --- | --- |


- ✓ Django Channels: InMemoryChannelLayer (no Redis — sufficient for demo), ChatConsumer per booking room
- ✓ WebSocket room keyed by booking_id — only the assigned customer and worker can connect (verified via JWT on connect)
- ✓ Real-time booking status: when worker accepts/completes, customer's dashboard updates instantly without page reload
- ✓ Messages stored in MongoDB Message document — chat history persists across reconnections
- ✓ JWT in HTTP-only cookies — immune to XSS. SameSite=Lax on cookies to prevent CSRF
- ✓ CORS locked to Vercel domain only. HTTPS enforced on both Railway and Vercel automatically
- ✓ Paystack webhook HMAC-SHA512 verification — only genuine Paystack events processed
- ✓ Environment secrets audit: run git log --all --full-history -- .env to confirm zero secrets in git history

| ⚡ Real-time chat between customer and worker is the single feature that will make your assessor say 'wow'. It demonstrates WebSockets, auth scoping, and real-time architecture in one feature. It is not difficult with Django Channels — one consumer class, one room per booking_id. |
| --- |




| 09 | Launch | Testing — Unit, Integration & Postman | Days 71–76 |
| --- | --- | --- | --- |


- ✓ pytest-django: unit tests for booking FSM (all valid transitions + all invalid rejections return 400)
- ✓ Test OTP expiry: OTP older than 10 minutes is rejected. Rate limit: 6th request within hour returns 429
- ✓ Payment webhook test: replay a captured Paystack charge.success payload, verify Payment document updates correctly
- ✓ Review guard test: POST /api/v1/reviews/ on a PENDING booking returns 403
- ✓ Postman collection: all 30+ endpoints exported as JSON and committed to repo — import URL shared in README
- ✓ API documentation: DRF browsable API enabled in dev mode for live exploration

| ⚡ You don't need 100% test coverage. Cover the booking FSM completely (it's the core logic), the payment webhook handler (it handles real money), and the auth rate limiter (it's a security feature). Those three test suites will impress an assessor who understands what matters. |
| --- |




| 10 | Launch | Seed Data, Demo Prep & Live URL | Days 77–80 |
| --- | --- | --- | --- |


- ✓ Seed command pre-loads: 1 admin, 5 approved workers (electrician, plumber, makeup artist, tutor, mechanic), 3 customers, bookings in every FSM state, reviews on completed bookings
- ✓ Demo credentials card: admin (phone + code), worker (2 accounts), customer (2 accounts) — printed and/or in README
- ✓ Demo script: 3-minute walkthrough — customer searches plumber → books → worker accepts (real-time update on customer screen) → payment → job done → review
- ✓ Wake-up check: visit the live Vercel URL 10 minutes before any demo to wake the Atlas free cluster from inactivity sleep

| ⚠ The seed command is the single most underrated thing in student project submissions. Pre-loading realistic demo data means your assessor sees a live, working product the moment they open the URL — not an empty database with a login screen asking them to sign up. |
| --- |




| 11 | Launch | Documentation — README & Architecture Diagram | Day 81 |
| --- | --- | --- | --- |


- ✓ README sections: Live URL, demo credentials, tech stack table, architecture overview, local setup steps, .env.example, design decisions, security measures, future roadmap
- ✓ Design decisions section: 'Why mongoengine not Djongo', 'Why Next.js on Vercel', 'Why phone-first auth', 'Why escrow payments' — shows you understand what you built
- ✓ Security section lists the 6 implemented measures: HTTP-only JWT cookies, HMAC webhook verification, CORS restriction, OTP rate limiting, HTTPS everywhere, no secrets in git
- ✓ Future roadmap: Real OTP (Termii live), NIN/BVN verification (Smile Identity), GPS tracking, video call consultation, M-Pesa for Kenya, Ghanaian launch

| ⚡ Write the README last, but allocate a full day for it. Assessors read READMEs before opening any code. A great README frames everything they see afterward. It is the difference between 'nice project' and 'this person knows what they're building'. |
| --- |




| 12 | Launch | Pan-African Expansion Architecture (Post-MVP) | Future |
| --- | --- | --- | --- |


- ✓ CountryConfig document added to DB: per-country settings for currency, payment gateway, OTP provider, ID type, timezone
- ✓ Every document model gains a country_code field — enables multi-country queries and country-level analytics
- ✓ Nigeria: Paystack + Termii + NGN + NIN verification (Smile Identity)
- ✓ Ghana: Paystack + Hubtel OTP + GHS + Ghana Card verification
- ✓ Kenya: M-Pesa STK Push + Africa's Talking + KES + Kenyan National ID
- ✓ Frontend: i18next installed from day 1, all UI strings externalised. English at launch, French and Swahili scaffolded for expansion
- ✓ Smile Identity integration: NIN/BVN for Nigeria, Ghana Card for Ghana, Kenya National ID for Kenya — all via one SDK

| ⚡ The beauty of the CountryConfig architecture: adding a new country is configuration, not code. You flip a flag in the admin panel, set gateway API keys in environment variables, and the platform is live. No new Django apps, no new endpoints, no new frontend pages. |
| --- |



**UI/UX DESIGN SYSTEM**
**Design Principles**
- ✓ Mobile-first: 390px base viewport. Over 70% of Nigerian internet users access the web via smartphone.
- ✓ Performance-first: lazy-load images, skeleton loading states everywhere, no blocking scripts above the fold.
- ✓ Trust-first: verified badges prominent, star ratings large and visible, real worker photos mandatory.
- ✓ Low-bandwidth aware: Cloudinary auto-format and quality transformation on all images (f_auto,q_auto in URL).
**Colour System**

| Token | Hex Value | Usage |
| --- | --- | --- |
| primary | #1a5c38 | CTA buttons, nav links, active states, verified badge background |
| primary-dark | #0f3d26 | Hover states on primary buttons, heading underlines |
| primary-light | #e8f5ee | Category card backgrounds, success message backgrounds |
| accent | #f5a623 | Amber star ratings, price highlights, premium badges |
| accent-light | #fff8ee | Tip boxes, highlighted info panels |
| neutral-900 | #111827 | Primary body text, headings |
| neutral-600 | #4b5563 | Secondary text, placeholders, subtitles |
| neutral-200 | #e5e7eb | Card borders, dividers, input borders |
| neutral-50 | #f9fafb | Page background, table alternate rows |
| danger | #dc2626 | Error states, rejected badges, cancel actions |
| success | #16a34a | Approved badges, confirmed status, completed jobs |


**Three Portals — Key Screens**
Each portal has a distinct information hierarchy matching its user's mental model:

| Portal | Primary Goal | Most Important Screen | Key UI Decisions |
| --- | --- | --- | --- |
| Customer | Find and book a worker quickly | Worker profile page | Large photo, rating prominent, book button always visible (sticky sidebar) |
| Worker | Manage jobs and track earnings | Incoming requests screen | Accept/reject prominent, earnings stat card top of every page |
| Admin | Maintain platform quality and trust | Worker approval queue | ID document preview, one-click approve/reject, reason field |


**Component Library (shadcn/ui)**
Run this command on Day 15 (first day of frontend work) — installs all components needed:
- npx shadcn-ui@latest add button card input badge table select dialog sheet avatar skeleton tabs
Additional packages to install alongside shadcn/ui:

| Package | Purpose |
| --- | --- |
| react-day-picker | Date/time picker for booking scheduling |
| recharts | Revenue and bookings charts on admin dashboard |
| react-hot-toast | Toast notifications for booking updates, errors |
| react-query (TanStack) | Server state management — caching, refetch, loading states |
| zustand | Client state (auth user, selected filters) |
| leaflet + react-leaflet | Interactive map for worker location (no API key) |
| lucide-react | Icon set — consistent with shadcn/ui component icons |
| clsx + tailwind-merge | Conditional className utility — already included with shadcn |



**SECURITY ARCHITECTURE**
**Implemented Security Measures**
These 8 security measures are implemented in the MVP. Each is documented in the README so assessors see them explicitly:

| Measure | Implementation | What It Prevents |
| --- | --- | --- |
| HTTP-only JWT cookies | SimpleJWT + cookie settings in DRF | XSS attacks stealing auth tokens from localStorage |
| CORS restriction | django-cors-headers: ALLOWED_ORIGINS = [Vercel URL] | Cross-origin API calls from malicious domains |
| HTTPS everywhere | Railway + Vercel enforce HTTPS automatically | Man-in-the-middle attacks, token interception |
| OTP rate limiting | Max 5 attempts per phone per hour via MongoDB counter | Brute-force OTP guessing attacks |
| Webhook HMAC verification | SHA-512 signature check on every Paystack webhook | Fake payment events from malicious actors |
| RBAC permission classes | IsCustomer, IsWorker, IsAdmin on every endpoint | Customers accessing worker-only routes, etc. |
| Booking FSM validation | Server-side state transition enforcement | Clients manipulating booking status directly |
| No secrets in git | All secrets in Railway/Vercel env panels, .env in .gitignore | Credential exposure in public repositories |


**Future Security (Pre-Launch)**
- – *NIN/BVN verification via Smile Identity — prevents fake worker identities*
- – *2FA for admin accounts — prevents account takeover on the highest-privilege role*
- – *OWASP ZAP penetration test — systematic vulnerability scan before real money flows*
- – *Encrypted PII at rest — encrypt ID document URLs and phone numbers using django-encrypted-model-fields*
- – *Fraud detection rules — flag accounts with >3 disputes, unusual price spikes, same-device multiple accounts*

**DEPLOYMENT & INFRASTRUCTURE**
**Free-Tier Hosting Architecture**

| Service | Provider | Free Tier Limit | What Breaks First |
| --- | --- | --- | --- |
| Django API | Railway.app | $5 credit/month (~500 hrs compute) | Exceeded monthly compute hours |
| Next.js Frontend | Vercel | 100GB bandwidth, unlimited deploys | Bandwidth (unlikely for student project) |
| MongoDB | Atlas M0 | 512MB storage, shared cluster | Storage limit or cluster sleeping |
| Media Storage | Cloudinary | 25GB storage, 25 credits/month | Monthly transformation credits |
| SMS Alerts | Termii | Free trial credits (~50 SMS) | Trial credits exhausted |


**Auto-Deploy Pipeline**
- ✓ Push to main branch on GitHub → Railway auto-deploys Django backend in ~60 seconds
- ✓ Push to main branch on GitHub → Vercel auto-deploys Next.js frontend in ~45 seconds
- ✓ Zero-downtime: Railway keeps old container running until new one passes health check
- ✓ Environment variables managed in Railway and Vercel dashboards — never in the repository
**When You Go Live (Post-Student)**

| Service | Free → Paid | Monthly Cost | When to Upgrade |
| --- | --- | --- | --- |
| Railway | Starter plan | $5/month | Free credits exhausted (~100 users) |
| Vercel | Pro plan | $20/month | Need team features or higher bandwidth |
| MongoDB | Atlas M2 | $9/month | Approaching 512MB or need dedicated cluster |
| Termii | Pay-per-SMS | ~$0.01/SMS | Launch day — real OTP delivery |
| Paystack | Live mode | 1.5% + ₦100 | First real transaction |
| Cloudinary | Plus plan | $0 still | Over 25GB (unlikely until scale) |



| ⚡ Total cost to go live: approximately $34–44/month for a fully production-grade stack. This is lower than most SaaS tools students use. The architecture you're building as a student project is indistinguishable from a funded startup's infrastructure. |
| --- |



**SCHOOL PROJECT TO REAL STARTUP**
**What the Student Version Has**
- ✓ Complete, working booking flow — customer to worker to payment to review
- ✓ Three role-based portals — customer, worker, admin — each purpose-built
- ✓ Real payment integration — Paystack test mode is indistinguishable from production in demos
- ✓ Real-time features — WebSocket chat and booking status updates
- ✓ Security measures documented and implemented
- ✓ Architecture designed for Pan-African expansion from day one
**What to Add Before Real Users**

| Before first real user<br>✓  Termii live OTP (real SMS, ~$0.01 each)<br>✓  Smile Identity KYC (NIN/BVN verification)<br>✓  Paystack live mode (real payments)<br>✓  Redis for Django Channels (replace in-memory)<br>✓  Sentry error monitoring (free tier)<br>✓  Admin 2FA (protect the highest-privilege role) | Pan-African expansion<br>→  CountryConfig + Ghana activation<br>→  M-Pesa STK Push for Kenya<br>→  Smile Identity Ghana + Kenya modules<br>→  i18next French translations (Francophone Africa)<br>→  React Native mobile app (shared 80% of API)<br>→  AI worker-matching score engine |
| --- | --- |


**Your Real Competitive Moat**
The technology is the easy part to copy. What will be hard to replicate: 50 real verified workers in Lagos with real reviews from real customers. Every platform competitor starts with the same problem you do — an empty marketplace. The student project gives you the infrastructure. The real work is acquiring those first 50 workers before you launch publicly.
Strategy: while building the platform, manually recruit 30–50 workers in your city through WhatsApp groups, university notice boards, and direct outreach. Onboard them personally, take their profile photos, write their bios. When you launch, the platform already looks alive.

| ⚡ The single highest-value action after submission: get 10 real workers on the platform before showing it to anyone as a real product. A marketplace with workers is a product. A marketplace without workers is a demo. |
| --- |




SkillBridge — Full Development Blueprint   |   *Nigeria-first · Pan-African Vision · Built for real, built to scale*