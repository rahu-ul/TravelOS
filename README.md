# TravelOS — Premium Kerala Travel & Tour Management Platform

Full-stack production-grade travel platform, versioned package CMS, AI-assisted enquiry processing, and enquiry inbox built for a Kochi-based Kerala and South India tour operator.

**Stack:**
- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router 7, Redux Toolkit, Axios.
- **Backend:** Node.js, Express, MongoDB Atlas + Mongoose 8, Zod, JWT (httpOnly cookies), bcrypt.
- **SSR & SEO:** Server-rendered package details, dynamic OpenGraph/meta tags, JSON-LD schema, robots.txt, sitemap.xml, 140 legacy redirects.
- **AI Processing:** Async requirements extraction, top-3 published package recommendations, and draft response generation with human-in-the-loop consultant approval.

---

# Assessment Demo Access

This section provides complete details for external assessment reviewers to discover, access, and evaluate both the public Traveller experiences and the restricted Staff Admin Portal.

### Application URLs

| Interface | URL Path | Description |
|---|---|---|
| **Public Website** | `/` | Curated Kerala itineraries, destinations, travel stories, enquiry forms |
| **Traveller Signup** | `/signup` | Public registration for travellers |
| **Traveller Login** | `/login` | Authentication for travellers to access personal dashboard |
| **Traveller Dashboard** | `/dashboard` | Protected view of traveller profile & submitted enquiries with real statuses |
| **Admin Login** | `/admin/login` | Dedicated staff & reviewer authentication portal |
| **Admin Dashboard** | `/admin/dashboard` | Protected staff overview (also redirects cleanly from `/admin`) |
| **Package CMS** | `/admin/packages` | Versioned package builder, seasonal pricing, drafts, restore & publish |
| **Story CMS** | `/admin/stories` | Blog & story management (create, edit, publish/draft, tag, delete) |
| **Enquiry Inbox & AI** | `/admin/enquiries` | Live CRM inbox, AI requirements extraction & reply approval |
| **Quote Builder** | `/admin/quotes` | Branded quotation generator with 5% GST calculation & PDF print |

---

### Traveller Demo Workflow

1. **Registration**:
   - Navigate to `/signup` or click **Sign Up** in the website header/footer.
   - Enter Full Name, Email, Password (min 10 characters with upper, lower and digit) and Confirm Password.
   - The backend validates all inputs, ensures passwords match, prevents duplicate emails, and strictly assigns the `TRAVELLER` role.
2. **Dashboard Access**:
   - Upon successful signup or login at `/login`, the traveller is directed to `/dashboard`.
   - Displays traveller account information and any submitted journey enquiries matching the account email.
3. **Submit an Enquiry**:
   - Go to any package detail page (e.g. `/packages/munnar-thekkady-alleppey-houseboat`) or `/contact`.
   - Fill out an enquiry using your registered traveller email.
   - Return to `/dashboard` to observe your real enquiry with reference ID (e.g. `ENQ-2026-XXXX`), dates, guests, and pipeline status (`new`).
4. **Session Persistence & Logout**:
   - Refresh `/dashboard` to verify that the secure httpOnly JWT session persists.
   - Click **Sign Out** to clear the session cookie. Subsequent direct navigation to `/dashboard` redirects to `/login`.

---

### Admin Demo Workflow

1. **Discovery**:
   - Reviewers can discover the Admin Portal via the **Admin Portal** button in the website header or via **Assessment Reviewer / Admin Login** in the footer.
   - Opens `/admin/login`.
2. **Demo Admin Credentials**:
   - Seeded in the database via the controlled seed / deployment script:
     - **Email:** `admin@travelos.example`
     - **Password:** `TravelOS_Demo_2026!` (configured via `SEED_DEFAULT_PASSWORD` / `DEMO_ADMIN_PASSWORD`)
   - Or Consultant account: `consultant@travelos.example` (same password).
   - *Note: Demo passwords are never hardcoded into production client bundles or exposed on public pages.*
3. **Admin Experience**:
   - Logging in at `/admin/login` redirects to `/admin/dashboard`.
   - **Package CMS (`/admin/packages`)**: View published packages and draft packages, edit seasonal pricing, preview drafts, inspect version history, duplicate or publish.
   - **Enquiries & AI (`/admin/enquiries`)**: Review incoming traveller enquiries, assign consultants, view AI requirements extraction, review AI package recommendations, add internal notes, and approve draft replies.
4. **Boundary & Protection**:
   - Logging into a Traveller account and visiting `/admin/dashboard` or `/admin/packages` is blocked (backend returns 403 Forbidden, frontend redirects with access denied).

---

### Features to Review

1. **Public Package Browsing & Filter Drawer**:
   - Multi-facet filtering on `/packages` (destinations, duration buckets, hotel star categories, budget ranges, travel months).
2. **Package Details & SSR**:
   - `/packages/:slug` displays verified backend-driven seasonal pricing, day-by-day accordion, hotel listings, and inclusions.
   - Tested under Server-Side Rendering (`/ssr/packages/:slug`) with JSON-LD and strict CSP theme script hash.
3. **Light & Dark Themes**:
   - Sun/Moon toggle in navbar and footer. Zero flash of un-themed content on refresh.
4. **Traveller Authentication & Real Enquiry Tracking**:
   - Client signup, login, session restore, and real-time query of user's submitted enquiries.
5. **Staff Admin Operations**:
   - Immutability of published packages, draft isolation, SLA overdue flags on enquiries, and human-in-the-loop AI draft approvals.
6. **Blog / Travel Story CMS (`/admin/stories`)**:
   - Manage rich travel articles, guides, and stories linked directly to package listings.
7. **Branded Quote Builder & PDF Print (`/admin/quotes`)**:
   - Generate official customer quotations with 5% GST calculation, twin-sharing notes, and instant print/PDF formatting.

---

### Automated Test Suite (175 Tests)

Run all test suites across the project:
```bash
# Unit tests (65 tests)
cd server
npm test -- tests/unit

# Integration tests with MongoDB (55 tests)
$env:TEST_MONGODB_URI="<your-mongodb-uri>"
npm test -- tests/integration

# Hardening & Security tests (55 tests)
npm test -- tests/hardening

# Client Production Build
cd ../client
npm run build
```

---

## Controlled Production Deployment & Seed Setup

When deploying to production platforms (Render, Railway, Fly.io, etc.):

1. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/travelos?retryWrites=true&w=majority
   JWT_SECRET=<64-char-random-hex-string>
   CLIENT_ORIGIN=https://your-domain.com
   DEMO_ADMIN_EMAIL=admin@travelos.example
   DEMO_ADMIN_PASSWORD=<strong-demo-password>
   ```

2. **Controlled Admin Account Creation (Idempotent)**:
   A dedicated seed script ensures the demo admin account exists without resetting existing production data:
   ```bash
   cd server
   npm run seed:admin
   ```
   This command checks if `DEMO_ADMIN_EMAIL` exists:
   - If missing, creates the active `staff_admin` account using `DEMO_ADMIN_PASSWORD`.
   - If present, ensures the role is `staff_admin` and active without destructively altering passwords or deleting customer data.

3. **Rotating Credentials Post-Assessment**:
   To revoke reviewer access post-assessment, set `DEMO_ADMIN_PASSWORD` to a new secret or disable the account in MongoDB (`isActive: false`).

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Local Environment
Ensure `.env` in repository root has valid `MONGODB_URI` and `JWT_SECRET`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/travelos
JWT_SECRET=0ff13fbac5b14d81c59344dc5bc48d92bf25c6e742ad12df4f17a475b8f5ace0b698f620a8f407188766c79730aefe41
CLIENT_ORIGIN=http://localhost:5173
SEED_DEFAULT_PASSWORD=TravelOS_Demo_2026!
```

### 3. Seed Database & Run Admin Setup
```bash
cd server
npm run seed:admin
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

Visit `http://localhost:5173`.
