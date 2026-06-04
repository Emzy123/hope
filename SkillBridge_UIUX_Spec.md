# SkillBridge — Industry-Level UI/UX Specification
**Nigeria-first · Pan-African Vision · Django + MongoDB + Next.js**

> **How to use this document:** Every page is broken into Layout, Sections, Components, States, and Responsive Behaviour. Feed each page section independently to your AI assistant. Never paste the whole document at once — scope each prompt to one page.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Routing Architecture](#2-routing-architecture)
3. [Shared Components](#3-shared-components)
4. [Public Pages](#4-public-pages)
   - 4.1 Landing Page
   - 4.2 Service Browser
   - 4.3 Worker Public Profile
5. [Auth Flow](#5-auth-flow)
   - 5.1 Phone Entry
   - 5.2 OTP Verification
   - 5.3 Onboarding — Customer
   - 5.4 Onboarding — Worker
6. [Customer Portal](#6-customer-portal)
   - 6.1 Customer Dashboard
   - 6.2 Booking Flow (4 steps)
   - 6.3 Active Booking Detail
   - 6.4 Booking History
   - 6.5 Leave a Review
   - 6.6 Customer Profile Settings
7. [Worker Portal](#7-worker-portal)
   - 7.1 Worker Home
   - 7.2 Incoming Requests
   - 7.3 Active Job View
   - 7.4 Earnings & History
   - 7.5 Worker Profile Editor
   - 7.6 Availability Toggle
8. [Admin Panel](#8-admin-panel)
   - 8.1 Admin Dashboard
   - 8.2 Worker Approval Queue
   - 8.3 Worker Detail Review
   - 8.4 Bookings Management
   - 8.5 Dispute Resolution
   - 8.6 Category Manager
   - 8.7 Platform Settings
9. [Real-Time & Chat](#9-real-time--chat)
10. [Empty States & Error Pages](#10-empty-states--error-pages)
11. [AI Assistant Prompt Templates](#11-ai-assistant-prompt-templates)

---

## 1. Design System

### 1.1 Colour Tokens

Define these in `tailwind.config.js` under `theme.extend.colors`:

```js
colors: {
  primary: {
    DEFAULT: '#1a5c38',
    dark:    '#0f3d26',
    light:   '#e8f5ee',
  },
  accent: {
    DEFAULT: '#f5a623',
    light:   '#fff8ee',
  },
  neutral: {
    900: '#111827',
    600: '#4b5563',
    200: '#e5e7eb',
    50:  '#f9fafb',
  },
  danger:  '#dc2626',
  success: '#16a34a',
}
```

### 1.2 Typography Scale

| Token        | Size    | Weight | Use                             |
|--------------|---------|--------|---------------------------------|
| `text-display` | 36–48px | 700  | Hero headings (landing only)    |
| `text-h1`    | 28–32px | 700    | Page titles                     |
| `text-h2`    | 20–24px | 600    | Section headings                |
| `text-h3`    | 16–18px | 600    | Card titles, modal headings     |
| `text-body`  | 14–16px | 400    | Body copy                       |
| `text-label` | 12–13px | 500    | Form labels, badge text         |
| `text-caption`| 11–12px | 400   | Timestamps, helper text         |

Font family: `Inter` (Google Fonts). Fallback: `system-ui, sans-serif`.

### 1.3 Spacing & Layout

- **Base unit:** 4px
- **Page max-width:** `1280px`, centered, `px-4 md:px-8 lg:px-16`
- **Card border-radius:** `rounded-xl` (12px)
- **Button border-radius:** `rounded-lg` (8px)
- **Input border-radius:** `rounded-md` (6px)
- **Shadow:** `shadow-sm` for cards, `shadow-md` for modals, `shadow-xl` for dropdowns

### 1.4 Component Variants

**Button variants:**
```
Primary   → bg-primary text-white hover:bg-primary-dark
Secondary → border border-primary text-primary hover:bg-primary-light
Ghost     → text-primary hover:bg-primary-light (no border)
Danger    → bg-danger text-white hover:bg-red-700
Disabled  → opacity-50 cursor-not-allowed
```

**Badge variants:**
```
Verified   → bg-primary text-white
Top Rated  → bg-accent text-neutral-900
Pending    → bg-yellow-100 text-yellow-800
Active     → bg-green-100 text-success
Cancelled  → bg-red-100 text-danger
Disputed   → bg-orange-100 text-orange-700
```

**Status pill mapping (Booking FSM):**
```
PENDING     → yellow  "Awaiting Response"
ACCEPTED    → blue    "Confirmed"
IN_PROGRESS → purple  "In Progress"
DONE        → green   "Completed"
DISPUTED    → orange  "Under Review"
CANCELLED   → red     "Cancelled"
EXPIRED     → gray    "Expired"
```

### 1.5 Iconography

Use `lucide-react` exclusively. Key icons:

| Context             | Icon name              |
|---------------------|------------------------|
| Worker verified     | `ShieldCheck`          |
| Star rating         | `Star` (filled amber)  |
| Location            | `MapPin`               |
| Phone               | `Phone`                |
| Chat                | `MessageSquare`        |
| Earnings            | `Wallet`               |
| Calendar            | `CalendarDays`         |
| Toggle available    | `ToggleLeft/Right`     |
| Approve             | `CheckCircle`          |
| Reject              | `XCircle`              |
| Category            | `LayoutGrid`           |
| Dispute             | `AlertTriangle`        |
| Upload              | `Upload`               |

### 1.6 Loading Patterns

- **Skeleton screens** — never show spinners for content that has a known shape.
- Use `shadcn/ui Skeleton` component with the same card dimensions as the real content.
- **Toast notifications** — `react-hot-toast` positioned `top-right` on desktop, `bottom-center` on mobile.
- **Optimistic UI** — for availability toggle and booking status actions, update UI immediately and rollback on error.

---

## 2. Routing Architecture

```
app/
├── (public)/
│   ├── page.tsx                    → Landing
│   ├── browse/page.tsx             → Service Browser
│   └── workers/[id]/page.tsx       → Worker Public Profile
│
├── (auth)/
│   ├── login/page.tsx              → Phone Entry
│   ├── verify/page.tsx             → OTP Verification
│   └── onboarding/
│       ├── customer/page.tsx       → Customer onboarding
│       └── worker/page.tsx         → Worker onboarding (multi-step)
│
├── (customer)/                     → Protected: role === CUSTOMER
│   ├── dashboard/page.tsx
│   ├── book/[workerId]/page.tsx    → Booking Flow
│   ├── bookings/page.tsx           → Booking History
│   ├── bookings/[id]/page.tsx      → Active Booking Detail
│   └── profile/page.tsx
│
├── (worker)/                       → Protected: role === WORKER
│   ├── home/page.tsx
│   ├── requests/page.tsx
│   ├── job/[bookingId]/page.tsx    → Active Job View
│   ├── earnings/page.tsx
│   └── profile/edit/page.tsx
│
└── (admin)/                        → Protected: role === ADMIN
    ├── dashboard/page.tsx
    ├── approvals/page.tsx
    ├── approvals/[workerId]/page.tsx
    ├── bookings/page.tsx
    ├── bookings/[id]/page.tsx
    ├── categories/page.tsx
    └── settings/page.tsx
```

**Route guards:** Each route group has a `layout.tsx` that reads the JWT cookie, decodes the role, and redirects to `/login` or the correct portal if role mismatches.

---

## 3. Shared Components

These components are used across portals. Build them once in `components/shared/`.

### 3.1 `<AppNavbar />`

**Renders differently by auth state and role:**

| State                | Left            | Center          | Right                              |
|----------------------|-----------------|-----------------|------------------------------------|
| Unauthenticated      | SkillBridge logo| —               | "Browse Services" · "Login" button |
| Customer logged in   | Logo            | —               | Notifications bell · Avatar menu   |
| Worker logged in     | Logo            | Availability toggle | Notifications bell · Avatar menu |
| Admin logged in      | Logo + "Admin"  | —               | Avatar menu only                   |

- **Mobile:** Hamburger menu slides in a `<Sheet>` from the right with nav links stacked vertically.
- **Avatar menu (dropdown):** Profile · My Bookings/Dashboard · Settings · Logout.
- **Notifications bell:** Shows unread count badge. Clicking opens a `<Popover>` with last 5 notifications.
- **Worker availability toggle:** `<Switch>` component inline in navbar. Green = available, gray = offline. Calls `PATCH /api/v1/workers/availability/` on change. Optimistic update.

### 3.2 `<WorkerCard />`

Used in Service Browser and search results.

```
┌──────────────────────────────────────────┐
│ [Photo 72x72 circle] [Name]  [Badge]     │
│                      [Category tags]     │
│                      ★ 4.8 (43 reviews)  │
│                      📍 Lagos            │
│                      ₦2,500/hr           │
│                      [Book Now] button   │
└──────────────────────────────────────────┘
```

Props: `worker: WorkerProfile`, `onBook: () => void`

- Photo: Cloudinary URL with `w_72,h_72,c_fill,f_auto,q_auto` transform.
- Badge: `<BadgePill tier={worker.badge_tier} />` — renders "Verified" or "Top Rated".
- Stars: Map 0–5 to filled/half/empty `Star` icons in amber.
- "Book Now": Routes to `/book/[workerId]`. Disabled + tooltip if worker `is_available === false`.

### 3.3 `<BookingStatusBadge />`

Renders a coloured pill from the FSM status string. Used everywhere a booking appears.

### 3.4 `<StarRating />`

Two modes:
- **Display mode:** Renders filled stars. Shows numeric average + review count.
- **Input mode:** Interactive stars (hover highlights, click to select). Used in the review form.

### 3.5 `<PortfolioGrid />`

Masonry grid of portfolio photos. Clicking any image opens a `<Dialog>` lightbox with prev/next arrows.

### 3.6 `<ChatPanel />`

Collapsible panel (fixed bottom-right on desktop, full-screen sheet on mobile). Connected via WebSocket per booking ID. Shows message bubbles (sent right, received left), timestamp. Typing indicator. Input field + send button.

### 3.7 `<EmptyState />`

Reusable empty state. Props: `icon`, `title`, `description`, `ctaLabel`, `ctaHref`.

---

## 4. Public Pages

### 4.1 Landing Page — `/`

**Purpose:** Convert visitors into registered customers or workers. Trust-building is the primary goal.

**Layout:** Single-column, full-width sections stacked vertically.

---

#### Section 1: Hero

**Desktop:** Two-column grid. Left: text + CTA. Right: full-bleed image.
**Mobile:** Stacked. Image above fold (cropped), text below.

| Element | Spec |
|---------|------|
| Headline | "Find Trusted Skilled Workers in Nigeria — Instantly" — `text-display font-bold text-neutral-900` |
| Subheadline | "Book verified plumbers, electricians, tutors and 60+ more services. Payment protected. Reviews guaranteed." — `text-body text-neutral-600` |
| Primary CTA | "Find a Worker" button → `/browse` — `bg-primary text-white px-8 py-4 text-lg` |
| Secondary CTA | "Join as a Worker" → `/onboarding/worker` — `ghost` variant |
| Trust chips | Three inline chips: "✓ KYC Verified Workers" · "✓ Escrow Payments" · "✓ Rated & Reviewed" |
| Hero image | Lagos cityscape or artisan at work. Cloudinary-hosted. `object-cover` fill. |

---

#### Section 2: How It Works

**Layout:** Three-step horizontal flow (desktop) / stacked (mobile).

Each step card:
- Large number (`01`, `02`, `03`) in primary-light background circle.
- Icon (`Search`, `CalendarDays`, `CheckCircle`).
- Step title (`text-h3`).
- 1-sentence description.

Steps: "Search by service or location" → "Book & pay securely" → "Rate your worker".

---

#### Section 3: Service Categories Grid

**Layout:** 4-column grid (desktop) / 2-column (mobile).
**Data:** Fetched from `GET /api/v1/categories/` — top-level categories only.

Each category card:
- `bg-primary-light rounded-xl p-6`
- Lucide icon centered, large (32px), `text-primary`
- Category name below, `text-h3 text-center`
- Full card is clickable → `/browse?category={slug}`

**"View all 60+ services"** text link below grid.

---

#### Section 4: Featured Workers

**Layout:** Horizontal scroll row (mobile) / 3-column grid (desktop).
**Data:** `GET /api/v1/workers/?badge_tier=TOP_RATED&limit=3`

Each item: `<WorkerCard />` component.

**Section header:** "Top Rated on SkillBridge" with amber star icon.

---

#### Section 5: Trust Banner

Full-width `bg-primary` dark green band. White text.

```
[Shield icon]          [Star icon]           [Wallet icon]
Admin-Verified         4.8 Average           Escrow Protected
Workers                Platform Rating       Payments
```

Three stat blocks centered. Numbers animated with `CountUp` on scroll-into-view.

---

#### Section 6: Worker Testimonials

**Layout:** Two cards side by side (desktop) / single card with dot pagination (mobile).

Each card:
- Worker photo (circle, 56px).
- Name + category.
- Star rating (5 stars).
- Quote text in italic.
- City badge.

Data: Hardcoded for MVP (seeded demo reviews).

---

#### Section 7: Worker CTA Banner

`bg-accent-light` panel. Two columns.

Left: "Are you a skilled worker?" headline + "Join thousands of workers earning more with SkillBridge." body.
Right: "Apply to Join" button → `/onboarding/worker`.

---

#### Section 8: Footer

Three-column (desktop) / stacked (mobile).

- Column 1: Logo + tagline + social links (Twitter, Instagram, WhatsApp).
- Column 2: "Services" links (top 6 categories).
- Column 3: "Company" links (About, FAQ, Contact, Privacy Policy, Terms).
- Bottom bar: "© 2025 SkillBridge. Nigeria-first · Pan-African Vision." + Payment logos (Paystack).

---

### 4.2 Service Browser — `/browse`

**Purpose:** Discovery and filtering. The user's primary search experience.

**Layout:** Two-panel layout on desktop. Sidebar (filters) + Main content (results).

---

#### Filter Sidebar (desktop: fixed left 280px / mobile: `<Sheet>` triggered by filter button)

| Filter | Component |
|--------|-----------|
| Category | `<Select>` or expandable tree from API |
| City | `<Select>` with Nigerian cities list |
| Min Rating | `<StarRating />` input mode — pick 1–5 |
| Max Price (₦/hr) | Range slider (`min=500 max=50000 step=500`) |
| Availability | `<Checkbox>` "Show only available workers" |
| Badge | `<CheckboxGroup>` — Verified, Top Rated |

"Apply Filters" button (mobile only — desktop filters apply on change).
"Clear All" ghost button.

---

#### Results Area (main column)

**Top bar:**
- Results count: "24 workers found in Lagos"
- Sort dropdown: "Highest Rated" / "Lowest Price" / "Most Reviews" / "Newest"
- Mobile: "Filters" button with active filter count badge

**Results grid:**
- Desktop: 3-column grid of `<WorkerCard />`
- Mobile: Single column list
- Loading: Skeleton cards (same dimensions as WorkerCard)
- Empty: `<EmptyState />` with "Try adjusting your filters"

**Pagination:**
- "Load more" button at the bottom (not numbered pages — better for mobile)
- Shows current count: "Showing 12 of 48 workers"

---

#### Search Bar (above results, full width)

- Large text input: "Search by service, skill, or worker name..."
- Debounced 300ms → calls `GET /api/v1/workers/?search=...`
- Clears with X button inside input.

---

### 4.3 Worker Public Profile — `/workers/[id]`

**Purpose:** Convert a browsing customer into a booking. This is the highest-conversion page — every element serves that goal.

**Layout:** Two-column on desktop (content left, sticky booking sidebar right). Single column on mobile.

---

#### Left Column — Worker Info

**Block 1: Cover + Avatar**
- Full-width cover image (Cloudinary portfolio[0] or green gradient fallback). Height 200px.
- Avatar overlapping cover, bottom-left. 96px circle. `ring-4 ring-white`.
- Name (`text-h1`), badge pill, category tags (chips).
- Location chip (`MapPin` icon + city name).

**Block 2: Stats Row**
- 3 inline stat blocks: `★ 4.8 Rating` · `43 Reviews` · `37 Jobs Done`
- Separated by vertical dividers.

**Block 3: About**
- Section heading: "About"
- `<p>` of worker bio (max 500 chars, "Read more" if truncated).
- Hourly rate prominent: "₦2,500 / hour" in `text-h2 text-primary`.

**Block 4: Services Offered**
- Section heading: "Services"
- Horizontal wrap of category chips (`bg-primary-light text-primary rounded-full px-3 py-1`).

**Block 5: Portfolio**
- Section heading: "Portfolio"
- `<PortfolioGrid />` — masonry, max 9 images, "View all" link.

**Block 6: Reviews**
- Section heading: "Reviews (43)"
- Rating breakdown bar chart (5★ → 1★ counts with progress bars).
- List of `<ReviewCard />` components. Each shows: avatar, name, stars, date, comment.
- "Load more reviews" button.

---

#### Right Column — Sticky Booking Sidebar (desktop) / Bottom Sheet CTA (mobile)

Desktop: `sticky top-24` card, `shadow-md rounded-xl p-6`.
Mobile: Fixed bottom bar with "Book {Name}" button that opens a full-screen sheet.

```
┌─────────────────────────────────┐
│  ₦2,500 / hour                  │
│  ★ 4.8 · 43 reviews             │
│  ● Available now                │
│                                 │
│  [Book {Name}]  ← full width    │
│                                 │
│  ✓ Escrow payment protection    │
│  ✓ Free cancellation 24h prior  │
│  ✓ Verified identity            │
└─────────────────────────────────┘
```

- Availability indicator: green dot "Available now" or gray dot "Currently unavailable".
- If unavailable: button disabled, tooltip "This worker is not taking jobs right now."
- If not logged in: button opens login modal, redirects back after auth.

---

## 5. Auth Flow

**Design principle:** Minimal friction. Phone-first. 3 steps max. Progress indicator always visible.

### 5.1 Phone Entry — `/login`

**Layout:** Centered card on white/neutral-50 background. Max-width 420px.

```
[SkillBridge logo]
"Enter your phone number"
[+234] [___ ___ ____]    ← PhoneInput component
[Continue] button
"New here? No problem — we'll set you up."
```

| Element | Spec |
|---------|------|
| Logo | `h-8`, centered |
| Heading | `text-h2 font-bold text-center` |
| Subtext | `text-caption text-neutral-600` |
| Phone input | Nigerian flag + `+234` prefix locked. Input accepts 10 digits. Auto-formats as typed. |
| Validation | Real-time: red border + error message if not valid Nigerian format |
| Button | Full-width, `bg-primary`, disabled until valid number entered |
| Error toast | "Too many attempts. Try again in 60 minutes." if rate-limited (429) |

---

### 5.2 OTP Verification — `/verify`

**Layout:** Same centered card. Back button top-left.

```
"Enter the 6-digit code"
"Sent to +234 801 234 5678"

[_] [_] [_] [_] [_] [_]   ← 6 separate input boxes

[Verify Code]
"Didn't receive it? Resend (45s)"
```

| Element | Spec |
|---------|------|
| 6 inputs | Each `w-12 h-14 text-center text-h2`. Auto-advance on digit entry. Auto-backspace on delete. Paste from clipboard fills all 6. |
| Timer | Counts down 60s. Resend enabled after timeout. Clicking resend calls `POST /api/v1/auth/request-otp/` again and resets timer. |
| Error state | All 6 inputs turn `border-danger`. "Incorrect code. 2 attempts remaining." |
| Success | 300ms green flash on all inputs → redirect |
| Redirect logic | If `user.name === null` (new user) → `/onboarding/customer`. Else → role-based portal. |

---

### 5.3 Onboarding — Customer — `/onboarding/customer`

**Purpose:** Capture name and optional photo. One screen. Fast.

```
"Welcome to SkillBridge 👋"
"Just a few quick details"

[Profile photo upload — large circle with camera icon]
"Upload a photo (optional)"

[Full name input]

[Get Started →] button
```

- Photo upload: Clicking circle opens file picker. Preview immediately. Uploads to Cloudinary on form submit (not on select).
- Name: Required. Min 2 chars.
- "Get Started" → `POST /api/v1/users/profile/` → redirect to `/dashboard`.

---

### 5.4 Onboarding — Worker — `/onboarding/worker`

**Purpose:** Collect all worker profile data before admin review. 4 steps with a progress bar.

**Progress bar:** 4 dots + connecting line at top. Active dot is `bg-primary`, completed is `bg-success`.

#### Step 1: Personal Info
- Profile photo upload (required for workers)
- Full name
- City (dropdown: Lagos, Abuja, Port Harcourt, Kano, Ibadan, Other)

#### Step 2: Services & Rate
- "What services do you offer?" → Multi-select category picker (searchable). Min 1, max 5.
- "Your hourly rate (₦)" → Number input. Helper: "Most workers in this category charge ₦X–₦Y/hr."
- Bio textarea: "Tell customers about yourself and your experience." 500 char max with live counter.

#### Step 3: Portfolio
- "Add photos of your previous work"
- Drag-and-drop upload zone. Shows thumbnails. Max 6 photos.
- Caption input per photo (optional).
- "Skip for now" link — can add later in profile editor.

#### Step 4: ID Verification
- "Upload a valid ID (NIN slip, National ID card, Driver's licence)"
- Single file upload. JPG/PNG/PDF. Max 5MB.
- Preview of uploaded document.
- Checkbox: "I confirm this is my own ID and the information is accurate."
- "Submit Application" button.

**Post-submit screen:**
```
[Hourglass icon — large, primary colour]
"Application Submitted!"
"Our team will review your profile within 24–48 hours.
You'll receive an SMS when you're approved."
[Browse the platform while you wait →]
```

---

## 6. Customer Portal

### 6.1 Customer Dashboard — `/dashboard`

**Purpose:** Overview of active bookings and quick actions.

**Layout:** Single column. Max-width 800px centered on desktop.

---

#### Section 1: Greeting Header
```
"Good morning, Chidi 👋"
"You have 2 active bookings"
```

#### Section 2: Active Bookings (if any)

Card per active booking:
```
┌─────────────────────────────────────────────┐
│ [Worker photo 48px] Emeka Okonkwo            │
│ Electrician · Today, 2:00 PM                │
│ [IN_PROGRESS badge]                         │
│ [View Details]  [Chat]  buttons             │
└─────────────────────────────────────────────┘
```

Real-time status updates via WebSocket — badge updates without page reload.

#### Section 3: Quick Search

"Need something done?" → Compact search bar → Routes to `/browse`.
Category shortcut chips below (top 6 most popular).

#### Section 4: Past Bookings Preview

"Recent History" heading. List of last 3 completed bookings.
Each row: worker name · service · date · status badge · "Leave Review" button (if DONE and no review yet).

"View all bookings →" link.

---

### 6.2 Booking Flow — `/book/[workerId]`

**4-step wizard. Each step is a separate view within the same page (no page navigation).**

Progress indicator: Step numbers 1–4 at top. Clicking completed steps navigates back.

---

#### Step 1: Job Details

```
Worker summary card (read-only):
[Photo] Emeka Okonkwo · Electrician · ★ 4.8 · ₦2,500/hr

"Describe the job"
[Textarea — "E.g. I need my bathroom light fixed. There are 3 outlets not working..."]
char counter 20/500 (min 20 required)

"Service category"
[Select — pre-selected from worker's categories, changeable]

"Job location"
[Text input — "Enter the address where the work will be done"]
```

---

#### Step 2: Schedule

```
"When do you need this done?"

[Calendar — react-day-picker. Disables past dates. Max 30 days ahead.]

"Preferred time"
[Time slot picker — 8:00 AM, 9:00 AM ... 6:00 PM in 1hr blocks. Horizontal scroll.]

"Estimated duration (optional)"
[Select: 1 hr / 2 hrs / 3 hrs / Half day / Full day]
```

---

#### Step 3: Review & Confirm

```
"Review your booking"

┌──────────────────────────────────┐
│ Worker:    Emeka Okonkwo         │
│ Service:   Electrical Repair     │
│ Date:      Sat, 14 Dec 2025      │
│ Time:      2:00 PM               │
│ Location:  12 Adeola St, Victoria│
│            Island, Lagos         │
│ Rate:      ₦2,500/hr             │
└──────────────────────────────────┘

"Important: Payment will be held in escrow until the job is complete."

[← Back]   [Confirm & Pay →]
```

---

#### Step 4: Payment (Paystack Redirect)

- Clicking "Confirm & Pay" calls `POST /api/v1/bookings/` → then `POST /api/v1/payments/initiate/`.
- Redirect to Paystack-hosted payment page.
- On success callback from Paystack → return to `/bookings/[id]?payment=success`.
- On failure → return to step 3 with error toast.

**Payment success screen (on return):**
```
[CheckCircle icon — large green]
"Booking Confirmed!"
"Your payment is securely held in escrow.
Emeka has been notified and will respond shortly."
[Track your booking →]
```

---

### 6.3 Active Booking Detail — `/bookings/[id]`

**Layout:** Two columns (desktop) / stacked (mobile).

#### Left: Booking Info

**Status timeline** (vertical stepper):
```
✓ Booking Requested      14 Dec, 10:02 AM
✓ Accepted by Worker     14 Dec, 10:15 AM
● In Progress            14 Dec, 2:00 PM  ← active
○ Job Complete
○ Payment Released
```

**Job details card:**
- Service, date/time, location (with Leaflet map embed showing pin at address).
- Price breakdown: Subtotal · Escrow status · Platform fee note.

**Action buttons (customer):**
- If PENDING: "Cancel Booking" (danger ghost button).
- If ACCEPTED: "Cancel Booking" · "Contact Worker" (chat).
- If IN_PROGRESS: "Report Issue / Raise Dispute" link (small, gray).
- If DONE + no review: "Leave a Review" (primary button, prominent).

#### Right: Chat Panel

`<ChatPanel bookingId={id} />` — full height on desktop. Bottom sheet trigger on mobile.

---

### 6.4 Booking History — `/bookings`

**Layout:** Full-width table (desktop) / card list (mobile).

#### Filters (top bar)
- Status tabs: All · Active · Completed · Cancelled
- Date range picker (optional)
- Search by worker name

#### Desktop Table

| Worker | Service | Date | Status | Amount | Action |
|--------|---------|------|--------|--------|--------|
| Emeka Okonkwo | Electrical | 14 Dec | ✅ Completed | ₦5,000 | View / Review |

#### Mobile Cards

```
┌─────────────────────────────────┐
│ [Photo] Emeka Okonkwo           │
│ Electrical · 14 Dec 2025        │
│ [COMPLETED] badge · ₦5,000      │
│ [View Details] [Leave Review]   │
└─────────────────────────────────┘
```

Empty state (no bookings): "No bookings yet. Find a worker to get started." + Browse button.

---

### 6.5 Leave a Review — Modal or `/bookings/[id]/review`

Opens as `<Dialog>` on desktop, full-screen on mobile.

```
"How was your experience with Emeka?"

[Worker photo + name]

[★ ★ ★ ★ ★]  ← interactive star picker (required)

[Textarea — "Tell others about your experience (optional)"]
500 char max

[Submit Review]
```

- Star rating required. Submit disabled until selected.
- On submit: `POST /api/v1/reviews/` → success toast "Review submitted! Thank you." → button replaced with "Review Submitted ✓".
- Cannot review the same booking twice (server enforces, UI hides the button after submission).

---

### 6.6 Customer Profile Settings — `/profile`

Single page, sectioned.

**Section: Personal Info**
- Avatar (clickable to upload new photo).
- Full name (editable input).
- Phone (read-only — primary identifier, cannot change).
- "Save changes" button.

**Section: Notifications**
- Toggle: "SMS notifications for booking updates"
- Toggle: "Email notifications" (future)

**Section: Account**
- "Delete my account" danger link → confirmation modal.

---

## 7. Worker Portal

### 7.1 Worker Home — `/home`

**Purpose:** At-a-glance operational dashboard. The worker's first screen every day.

**Layout:** Single column, max-width 900px.

---

#### Section 1: Header with Availability Toggle

```
"Good morning, Emeka"

[● Available for work]  ← large toggle switch
                          Green = on, Gray = off
"You'll appear in search results when available"
```

Toggle calls `PATCH /api/v1/workers/availability/`. Optimistic UI update.

---

#### Section 2: Today's Stats (4 stat cards)

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  2     │ │ ₦7,500 │ │  ★4.8  │ │  37    │
│ Jobs   │ │ Today  │ │ Rating │ │  Done  │
│ Today  │ │        │ │        │ │  Total │
└────────┘ └────────┘ └────────┘ └────────┘
```

---

#### Section 3: Incoming Requests (if any, max 3 shown)

"New Requests" heading with badge count.

Each request card (compact):
```
[Customer avatar] Chioma A. · Plumbing repair
Today · 3:00 PM · Victoria Island
[Accept] [Decline]
```

"View all requests →" link.

---

#### Section 4: Active Job (if any)

If currently IN_PROGRESS:
```
┌──────────────────────────────────────────┐
│ 🔧 ACTIVE JOB                            │
│ Chioma Adeyemi — Plumbing Repair         │
│ 12 Adeola St, VI Lagos                   │
│ Started 2:00 PM                          │
│ [Mark Complete]  [Open Map]  [Chat]      │
└──────────────────────────────────────────┘
```

---

#### Section 5: This Week's Earnings

Mini bar chart (recharts) — Mon to Sun, bar height = daily earnings.
Total: "₦24,500 this week" in `text-h2 text-primary`.

---

### 7.2 Incoming Requests — `/requests`

**Purpose:** Accept or decline pending bookings.

**Layout:** Card list. Sorted by scheduled_at ascending.

---

#### Filter bar
- Tabs: "New Requests" · "Upcoming" · "All"

---

#### Request Card (expanded)

```
┌──────────────────────────────────────────────┐
│ [PENDING badge]          Expires in 18h 32m  │
├──────────────────────────────────────────────┤
│ [Customer photo 48px]  Chioma Adeyemi        │
│                        ☆ First booking       │
│                                              │
│ Service: Plumbing Repair                     │
│ Date:    Saturday, 14 Dec · 3:00 PM          │
│ Location: 12 Adeola Street, Victoria Island  │
│                                              │
│ Job Description:                             │
│ "My bathroom sink has been leaking for 2     │
│  weeks. I also need the shower head changed."│
│                                              │
│ Quoted Rate: ₦2,500/hr (your rate)          │
├──────────────────────────────────────────────┤
│ [Decline]              [Accept Booking →]    │
└──────────────────────────────────────────────┘
```

- Countdown timer: Real-time countdown from 24h expiry. Turns red under 2h.
- "First booking" chip: if customer has 0 prior completed bookings on platform.
- Decline: Opens confirmation dialog with optional reason (not sent to customer, logged internally).
- Accept: Calls `POST /api/v1/bookings/{id}/accept/` → success toast → card moves to "Upcoming" tab.

---

### 7.3 Active Job View — `/job/[bookingId]`

**Purpose:** All information the worker needs to do the job.

**Layout:** Single column. Focused, minimal distraction.

---

#### Job Header

```
[IN_PROGRESS badge]
Plumbing Repair
Chioma Adeyemi · Today, 3:00 PM
```

---

#### Customer Contact Card

```
[Photo 56px] Chioma Adeyemi
☎ 0801 234 5678 (tap to call on mobile)
[Open Chat]
```

---

#### Location Card

```
📍 12 Adeola Street, Victoria Island, Lagos

[Leaflet.js map — pin at address]

[Open in Google Maps] external link
```

---

#### Job Description

Grey card with the customer's description text.

---

#### Action Area

Status-driven buttons:

**If ACCEPTED (not started):**
```
"Ready to begin?"
[Mark as Started] → calls POST /api/v1/bookings/{id}/start/
```

**If IN_PROGRESS:**
```
"Job in progress..."
[Timer showing elapsed time since accepted_at]
[Mark as Complete] → confirmation dialog → POST /api/v1/bookings/{id}/complete/
```

Mark Complete dialog:
```
"Confirm job complete?"
"Once marked complete, the customer will be notified
and payment will be released from escrow."
[Cancel]  [Yes, Job Complete]
```

---

### 7.4 Earnings & History — `/earnings`

**Layout:** Two sections — Earnings Overview + Job History.

---

#### Earnings Overview

**Period selector tabs:** This Week · This Month · All Time

**Summary row:**
```
Total Earned    Platform Fee    Net Payout
₦124,500        ₦14,940 (12%)  ₦109,560
```

**Bar chart (recharts):** Daily/weekly earnings bars. Hover tooltip shows date + amount.

**Payout status note:** "Payouts are processed within 24h of job completion."

---

#### Job History Table

| Date | Customer | Service | Amount | Status |
|------|----------|---------|--------|--------|
| 14 Dec | Chioma A. | Plumbing | ₦5,000 | Released |
| 13 Dec | Femi O. | Electrical | ₦7,500 | Released |

- Filterable by date range.
- Click row → booking detail in a `<Sheet>` (not full navigation).

---

### 7.5 Worker Profile Editor — `/profile/edit`

**Purpose:** Let workers update everything about their profile.

**Layout:** Tab-based. Three tabs: "About" · "Portfolio" · "Availability & Rate"

---

#### Tab 1: About

- Profile photo (click to change, preview immediately).
- Full name input.
- City select.
- Bio textarea (500 char, live counter).
- Service categories (multi-select searchable, max 5).
- "Save" button — only active if changes detected (dirty state).

---

#### Tab 2: Portfolio

```
Current photos (masonry grid with delete X on each):
[Photo 1 ×] [Photo 2 ×] [Photo 3 ×]

Add more photos:
[Drag & drop zone or click to browse]
Max 6 photos total. JPG, PNG. Max 2MB each.
```

Each photo can have a caption (editable inline).
Uploads to Cloudinary immediately on drop. Progress bar per file.

---

#### Tab 3: Availability & Rate

- **Hourly rate:** Number input with ₦ prefix. Helper text: "Customers see this on your profile."
- **Working hours (future):** Day-of-week toggles with time range per day.
- **Availability toggle:** Same as navbar toggle, larger format with explanatory text.

---

### 7.6 Availability Toggle

Not a separate page — always surfaced in:
1. Navbar (compact switch)
2. Worker Home header (large switch with label)
3. Profile editor Tab 3

Single API call: `PATCH /api/v1/workers/availability/` `{ is_available: boolean }`.

---

## 8. Admin Panel

**Design principle:** Operational clarity over aesthetics. Dense information, clear actions, keyboard-accessible.

### 8.1 Admin Dashboard — `/admin/dashboard`

**Layout:** Sidebar navigation (fixed left, 240px) + main content area.

---

#### Sidebar Navigation

```
[SkillBridge Admin]
─────────────────
📊 Dashboard
👷 Worker Approvals  [badge: 4]
📋 Bookings
⚠️ Disputes          [badge: 2]
🗂️ Categories
⚙️ Settings
─────────────────
[Admin Name]
[Logout]
```

Active item: `bg-primary-light text-primary font-semibold`.
Badges: Red circles with count for pending items.

**Mobile:** Sidebar collapses to icon-only rail (56px). Tap icon to expand.

---

#### Dashboard Stats Row (4 cards)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  247         │ │  1,432       │ │  ₦2.4M       │ │  4           │
│ Active       │ │ Total        │ │ Platform     │ │ Open         │
│ Workers      │ │ Bookings     │ │ Revenue      │ │ Disputes     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Each card: metric in `text-h1`, label in `text-caption text-neutral-600`, delta vs last week in small colored text.

---

#### Bookings Over Time Chart

Recharts `<LineChart>` — last 30 days. Two lines: total bookings (primary) + completed bookings (success).
Date range selector above chart.

---

#### Recent Activity Feed

Right column (desktop). List of last 10 platform events:
```
● Worker approved: Emeka Okonkwo      2 min ago
● Dispute raised: Booking #4821       15 min ago
● New worker application: Fatima K.   1 hr ago
● Booking completed: #4819            2 hrs ago
```

---

#### Pending Approvals Alert

If count > 0: Yellow banner across top of dashboard:
```
⚠️ 4 worker applications need your review.  [Review Now →]
```

---

### 8.2 Worker Approval Queue — `/admin/approvals`

**Purpose:** Review and approve/reject worker applications.

**Layout:** Full-width card list.

---

#### Filters

- Tabs: "Pending" · "Approved" · "Rejected"
- Sort: Newest first / Oldest first
- Search by name

---

#### Application Card (collapsed)

```
┌──────────────────────────────────────────────────────┐
│ [Photo 48px] Emeka Okonkwo   Applied: 2 hrs ago      │
│              Electrician · Lagos    [PENDING badge]   │
│ [Expand ▾]                                           │
└──────────────────────────────────────────────────────┘
```

Clicking "Expand" reveals the full review panel.

---

### 8.3 Worker Detail Review — `/admin/approvals/[workerId]`

**Purpose:** Full-screen review of a single worker application. This is the most important admin screen.

**Layout:** Two-column split on desktop.

---

#### Left Column: Worker Information

**Personal block:**
- Large photo (128px circle).
- Name, phone number (masked: 0801 ***5678).
- City, application date.
- Categories applied for.
- Bio text.

**Portfolio block:**
- Grid of uploaded portfolio photos (if any).
- "No portfolio submitted" empty state.

**ID Document block:**
```
"Identity Document"
[Document preview — image or PDF thumbnail]
[View Full Document] → opens in lightbox
```

---

#### Right Column: Decision Panel

```
[Worker profile summary — compact]

─────────────────────────────────

Decision:

[✓ Approve Worker]  ← primary button, full width

─────────────────────────────────

[✗ Reject Application]

Rejection reason (required if rejecting):
[Select reason dropdown]:
  - ID document unclear
  - Unable to verify identity
  - Incomplete profile
  - Duplicate account
  - Other

[Other reason text input — shown if "Other" selected]

[Confirm Rejection]  ← danger button
```

On approve: `POST /api/v1/admin/workers/{id}/approve/` → success toast → redirect to queue.
On reject: `POST /api/v1/admin/workers/{id}/reject/` → sends reason → redirect to queue.

---

### 8.4 Bookings Management — `/admin/bookings`

**Layout:** Full-width data table.

---

#### Filters & Search

```
[Search: booking ID, customer name, worker name]
[Status: All ▾] [Date range] [City ▾] [Export CSV]
```

---

#### Table

| ID | Customer | Worker | Service | Date | Status | Amount | Action |
|----|----------|--------|---------|------|--------|--------|--------|
| #4821 | Chioma A. | Emeka O. | Plumbing | 14 Dec | ⚠️ Disputed | ₦5,000 | View |

- Row click → booking detail sheet (right-side `<Sheet>` panel, not full navigation).
- Disputed rows highlighted with amber left border.
- Sortable columns (click header).
- Pagination: 25 per page, numbered.

---

### 8.5 Dispute Resolution — Booking Detail Sheet

Slides in from right when clicking a booking row or a disputed booking.

```
Booking #4821 — DISPUTED
───────────────────────
Customer: Chioma Adeyemi
Worker:   Emeka Okonkwo
Service:  Plumbing Repair
Date:     14 Dec, 3:00 PM
Amount:   ₦5,000 (escrowed)

Dispute raised: 14 Dec, 7:32 PM
Reason: "Worker did not complete the job as described."

Chat log:
[Full conversation thread between customer & worker]

───────────────────────
Resolution:

[Release to Worker]   [Refund Customer]
```

Both resolution actions require a confirmation dialog.

---

### 8.6 Category Manager — `/admin/categories`

**Layout:** Two-panel. Tree on left, edit form on right.

---

#### Category Tree (left)

```
▼ Home Services
  ▼ Plumbing
      Emergency Plumber        [●Active] [Edit] [Disable]
      Pipe Installation        [●Active] [Edit] [Disable]
  ▶ Electrical
▼ Beauty & Wellness
    Makeup Artist              [●Active] [Edit] [Disable]
+ Add top-level category
```

Expand/collapse with arrow. Drag-to-reorder (future).

---

#### Edit Form (right)

Shown when clicking "Edit":
```
Category Name: [___________]
Slug:          [___________] (auto-generated, editable)
Parent:        [Select parent ▾]
Icon:          [Lucide icon picker — searchable grid]
Active:        [Toggle]

[Save]  [Cancel]
```

---

### 8.7 Platform Settings — `/admin/settings`

**Sections:**

**Commission Rate:**
```
Platform commission: [12] %
(Applied to all completed bookings)
[Save]
```

**Notification Templates:**
- OTP SMS template (read-only, for reference).
- Booking confirmation SMS template (editable).

**Danger Zone:**
```
[Seed Demo Data]  — repopulates demo database
[View Error Logs] — link to Railway logs
```

---

## 9. Real-Time & Chat

### 9.1 WebSocket Connection Strategy

- Connect on mounting of any Booking Detail page (customer or worker).
- Room key: `booking_{id}`.
- JWT passed as query param: `ws://...?token={accessToken}`.
- On connect: load chat history from REST API, then subscribe to live events.
- On disconnect: show "Reconnecting..." banner. Auto-retry with exponential backoff (1s, 2s, 4s).

### 9.2 Event Types Received

| Event | UI Action |
|-------|-----------|
| `booking.status_changed` | Update `<BookingStatusBadge />` live |
| `chat.message` | Append message to chat, play notification sound |
| `booking.accepted` | Customer sees toast "Your booking was accepted!" |
| `booking.completed` | Customer sees "Job marked complete — leave a review" prompt |

### 9.3 Chat UI

```
┌─────────────────────────────────────┐
│  Chat with Emeka  ●Online           │
├─────────────────────────────────────┤
│                                     │
│ [Emeka] Hi! I'm on my way          │
│         2:01 PM                     │
│                                     │
│           [You] Great, I'm home ✓  │
│                       2:02 PM       │
│                                     │
├─────────────────────────────────────┤
│ [Type a message...]        [Send →] │
└─────────────────────────────────────┘
```

- Messages: Own messages right-aligned (`bg-primary text-white`). Received left-aligned (`bg-neutral-50`).
- Timestamps below each bubble.
- Seen indicator (single ✓ = sent, double ✓ = seen — future).
- Scroll to bottom on new message if user is already near bottom. Otherwise show "↓ 1 new message" chip.

---

## 10. Empty States & Error Pages

### 10.1 Empty State Inventory

| Page | Empty condition | Message | CTA |
|------|----------------|---------|-----|
| Service Browser | No workers match filters | "No workers found for those filters" | Clear Filters |
| Customer Dashboard | No active bookings | "No active bookings. Ready to get something done?" | Find a Worker |
| Worker Requests | No pending requests | "No new requests. Make sure you're set to Available!" | Toggle Available |
| Worker Earnings | No earnings yet | "Your earnings will appear here after your first completed job." | Edit Profile |
| Admin Approvals | No pending applications | "You're all caught up! No applications waiting." | — |
| Booking History | No past bookings | "You haven't made any bookings yet." | Browse Services |

### 10.2 Error Pages

**`/not-found` (404):**
```
[large 404 in primary colour]
"This page doesn't exist"
[← Back to Home]
```

**`/error` (500):**
```
[AlertTriangle icon]
"Something went wrong on our end"
"Our team has been notified. Please try again."
[Refresh Page]
```

**API error inline (within pages):**
- Toast: `react-hot-toast` error variant. Message from API `detail` field or fallback "Something went wrong. Please try again."
- Form errors: inline below the relevant field, red text, not toast.

---

## 11. AI Assistant Prompt Templates

Use these prompt templates to build each section. Replace `[PAGE_NAME]` and paste the relevant spec section above it.

---

### Template A: Build a New Page

```
Build the [PAGE_NAME] page for a Next.js 14 App Router project.

Tech stack: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, react-query.
Design system: Primary #1a5c38, Accent #f5a623, Neutral-900 #111827.

This is the [ROLE] portal. This page is ONLY for [ROLE] users.
Do NOT include any features or UI from other roles.

Page spec:
[PASTE RELEVANT SECTION FROM THIS DOCUMENT]

Requirements:
- Mobile-first responsive. Breakpoints: sm(640) md(768) lg(1024) xl(1280).
- All API calls via react-query (useQuery / useMutation). Base URL from NEXT_PUBLIC_API_URL env var.
- JWT sent via credentials: 'include' on all fetch calls (HTTP-only cookie).
- Use Skeleton components from shadcn/ui for loading states.
- Never show a spinner for content with a known shape — always use skeletons.
- Handle error states inline with a friendly message. Toast errors via react-hot-toast.
- Export as a default export named [PageName]Page.
```

---

### Template B: Build a Shared Component

```
Build the <[ComponentName] /> shared component for SkillBridge.

Tech stack: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, lucide-react.
Design system: Primary #1a5c38, Accent #f5a623, Neutral-900 #111827.

This component is used across multiple portals. It must NOT contain any role-specific logic.

Component spec:
[PASTE RELEVANT COMPONENT SECTION]

Requirements:
- Fully typed TypeScript props interface.
- Handles loading prop: shows skeleton variant.
- Handles error/empty states gracefully.
- No hardcoded data — all content comes from props.
- Export as named export.
```

---

### Template C: Fix Role Mixing

If your AI assistant is mixing roles, use this:

```
PROBLEM: The current implementation mixes Customer, Worker, and Admin features in one component/page.

FIX: Separate them into three distinct pages:
- /dashboard → Customer only. Shows: [customer-specific features from spec].
- /home → Worker only. Shows: [worker-specific features from spec].
- /admin/dashboard → Admin only. Shows: [admin-specific features from spec].

Each page should be a separate file. Use Next.js route groups:
- app/(customer)/dashboard/page.tsx
- app/(worker)/home/page.tsx
- app/(admin)/dashboard/page.tsx

Each route group has a layout.tsx that:
1. Reads the JWT from cookies.
2. Decodes the role field.
3. Redirects to /login if not authenticated.
4. Redirects to the correct portal if wrong role.

Do NOT use a single dashboard that conditionally renders by role.
Each portal must be a completely separate page tree.
```

---

*SkillBridge UI/UX Specification — Nigeria-first · Pan-African Vision*
*Version 1.0 — Generated for AI-assisted development*
