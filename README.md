# TravelOS – Tour Operator Website & Custom CMS

**Author:** Rahul Sharma (B.Tech – Computer Science Engineering, AI & Data Science)  
**GitHub Repository:** [https://github.com/rahu-ul/TravelOS](https://github.com/rahu-ul/TravelOS)  
**Live Frontend (Vercel):** [https://travel-os-indol.vercel.app/](https://travel-os-indol.vercel.app/)  
**Live Backend API (Render):** [https://travelos-backend-ksib.onrender.com](https://travelos-backend-ksib.onrender.com)  

---

## 1. Project Overview & Assessment Scope

TravelOS is a production-conscious travel management platform developed for a boutique Kerala tour operator based in Kochi. The project was built against a comprehensive technical assessment brief requiring:

1. A high-converting **Public Tour Operator Website** featuring immersive itineraries, seasonal pricing breakdowns, destination guides, and an enquiry flow with DPDP compliance and WhatsApp consent.
2. A **Staff Package CMS** supporting draft/publish lifecycles, immutable version histories, rollback capabilities, and strict seasonal date validations.
3. A **Blog/Story CMS** for publishing travel stories, SEO metadata, and related package associations.
4. A centralized **Enquiry Management Inbox** with automated SLA tracking, team assignment, internal consultant notes, and status pipelines.
5. An **AI-Assisted Enquiry Processing System** that deterministically parses raw customer messages into structured travel requirements, queries the live package database for top-3 contextual matches, and generates draft email replies for mandatory human review.
6. A **Branded Quotation Builder** with automated 5% GST calculations, seasonal rates, and instant PDF printing.
7. **Hybrid Server-Side Rendering (SSR)** for public package pages with canonical metadata, Open Graph tags, JSON-LD schema markup, robots.txt, sitemap.xml, and 140 legacy 301 redirects.

The platform is engineered as a modular monolith in JavaScript, deploying the React client to Vercel and the Express/Node.js service to Render, backed by MongoDB Atlas.

---

## 2. Live Deployment & Repository Links

- **Frontend Application:** [https://travel-os-indol.vercel.app/](https://travel-os-indol.vercel.app/)
- **Backend API & Health Check:** [https://travelos-backend-ksib.onrender.com/api/health](https://travelos-backend-ksib.onrender.com/api/health)
- **SSR Package Endpoint (Example):** [https://travelos-backend-ksib.onrender.com/ssr/packages/munnar-thekkady-alleppey-houseboat](https://travelos-backend-ksib.onrender.com/ssr/packages/munnar-thekkady-alleppey-houseboat)
- **Robots & Sitemap:** [https://travelos-backend-ksib.onrender.com/robots.txt](https://travelos-backend-ksib.onrender.com/robots.txt) | [https://travelos-backend-ksib.onrender.com/sitemap.xml](https://travelos-backend-ksib.onrender.com/sitemap.xml)
- **GitHub Repository:** [https://github.com/rahu-ul/TravelOS](https://github.com/rahu-ul/TravelOS)

---

## 3. Features Mapped to Assessment Requirements

| Assessment Requirement | Implementation Details | Key Files |
|---|---|---|
| **Public Itineraries & Details** | Day-wise timeline, hotel categories, inclusions/exclusions, gallery, coordinates, and seasonal price cards. | `client/src/public/pages/PackageDetailsPage.jsx`, `server/src/modules/packages/packages.service.js` |
| **Search & Faceted Filters** | Live query filtering by destination, duration range, hotel rating, season, and price sorting. | `client/src/public/pages/PackagesPage.jsx`, `server/src/modules/packages/packageCatalogue.js` |
| **Package CMS & Versioning** | Create, edit drafts, publish immutable snapshots, duplicate, preview, and restore historical revisions. | `client/src/admin/pages/AdminPackagesPage.jsx`, `server/src/modules/packages/packageCms.service.js` |
| **Seasonal Pricing Validation** | Enforces integer rupee prices, twin-sharing occupancy, GST flags, and non-overlapping date ranges. | `server/src/modules/packages/packageVersion.model.js`, `server/src/modules/packages/packages.validation.js` |
| **Enquiry Flow & DPDP Consent** | Public enquiry submission with reference codes, contact details, travel parameters, and explicit WhatsApp consent. | `client/src/public/pages/ContactPage.jsx`, `server/src/modules/enquiries/enquiry.model.js` |
| **Admin Inbox & SLA Tracking** | Filter by status/assignee, 1-hour SLA overdue flags, internal consultant discussion notes. | `client/src/admin/pages/AdminEnquiriesPage.jsx`, `server/src/modules/enquiries/enquiriesAdmin.service.js` |
| **AI Requirements Extraction** | Deterministic parsing of messy enquiry text (adults, kids, nights, destination, budget, must-haves). | `server/src/modules/enquiries/ai.service.js` |
| **AI Package Recommendations** | Real-time database scoring matching extracted criteria against published packages; zero hallucinated prices. | `server/src/modules/enquiries/ai.service.js` |
| **Human-in-the-Loop Review** | Consultants can review/edit extracted parameters and draft replies before approving delivery. | `client/src/admin/pages/AdminEnquiriesPage.jsx`, `server/src/modules/enquiries/enquiriesAdmin.service.js` |
| **Branded Quote Generator** | Custom PDF-ready quote builder with traveller info, package selection, 5% GST computation, and print styles. | `client/src/admin/pages/AdminQuotesPage.jsx` |
| **Blog / Story CMS** | Full CRUD for editorial stories, SEO tags, hero banners, and published package cross-linking. | `client/src/admin/pages/AdminStoriesPage.jsx`, `server/src/modules/stories/storyCms.service.js` |
| **Audit Activity Log** | Immutable append-only log tracking package publishes, draft updates, assignments, and reply approvals. | `server/src/modules/activity/activity.model.js`, `server/src/modules/activity/activity.service.js` |
| **SSR & SEO Architecture** | Pre-rendered HTML for search crawlers, canonical links, Open Graph tags, JSON-LD, and 140 legacy 301 redirects. | `server/src/modules/ssr/ssr.service.js`, `server/src/config/legacyRedirects.js` |
| **Dual Authentication** | Secure cross-domain authentication using httpOnly cookies (`SameSite=None`) and `Authorization: Bearer` fallback. | `client/src/api/client.js`, `server/src/middleware/authenticate.js` |

---

## 4. Technology Stack

### Frontend Client
- **Framework & Tooling:** React 18, Vite 5, JavaScript (ES modules)
- **Routing:** React Router v6 (SPA routing with Vercel URL rewrite fallbacks)
- **State Management:** Redux Toolkit (`authSlice` for user session and credentials)
- **Styling:** Tailwind CSS v4 with custom warm-editorial design tokens (dark/light theme support)
- **HTTP Client:** Axios with request/response interceptors for automatic Bearer token injection and error normalization
- **Print & PDF:** CSS `@media print` stylesheets for pixel-perfect quote generation

### Backend Server
- **Runtime & Framework:** Node.js (v20+ LTS / v24), Express 4
- **Database & ODM:** MongoDB Atlas with Mongoose 8
- **Validation:** Zod v3 schemas for strict request payload validation
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), password hashing via `bcrypt`
- **Security & Hardening:** Helmet (CSP headers with inline script hash), CORS allowlist, Express Mongo Sanitize, Express Rate Limit
- **Testing:** Vitest, Supertest

---

## 5. System Architecture

```
                                  ┌───────────────────────────┐
                                  │   Browser / Search Bot    │
                                  └─────────────┬─────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
            Static Assets / SPA Hits                            Direct SSR / API Requests
                       │                                                 │
                       ▼                                                 ▼
        ┌───────────────────────────────┐               ┌─────────────────────────────────┐
        │   Vercel Edge CDN             │               │   Render Web Service (Node/Exp) │
        │   https://travel-os-indol...  │               │   https://travelos-backend-...  │
        │   - React 18 SPA              │               │   - REST API (/api/...)         │
        │   - Tailwind CSS Assets       │               │   - SSR Endpoints (/ssr/...)    │
        │   - Client-side Routing       │               │   - Robots & Sitemap.xml        │
        └──────────────┬────────────────┘               │   - 140 Legacy 301 Redirects    │
                       │                                └────────────────┬────────────────┘
                       │ Axios API Requests (Dual Auth)                  │
                       │ [Bearer Token + SameSite Cookies]               │
                       └─────────────────────────────────────────────────┤
                                                                         ▼
                                                        ┌─────────────────────────────────┐
                                                        │   MongoDB Atlas (travelos DB)   │
                                                        │   - Users & Roles               │
                                                        │   - Packages & Versions         │
                                                        │   - Enquiries, Messages & Notes │
                                                        │   - Stories & Activity Logs     │
                                                        └─────────────────────────────────┘
```

---

## 6. Project Structure

```
TravelOS-Primary/
├── client/                           # React + Vite Frontend
│   ├── src/
│   │   ├── admin/                    # Admin Portal
│   │   │   ├── pages/                # Packages CMS, Enquiries, Quotes, Stories, Login
│   │   │   └── AdminLayout.jsx       # Admin navigation shell & sidebar
│   │   ├── api/
│   │   │   └── client.js             # Centralized Axios instance with dual auth
│   │   ├── app/
│   │   │   └── store.js              # Redux Toolkit store configuration
│   │   ├── components/               # Reusable UI components & layouts
│   │   ├── features/auth/            # Auth state slice and async thunks
│   │   ├── public/pages/             # Public pages (Home, Packages, Detail, Contact, Stories)
│   │   └── theme/                    # Light/dark theme provider and tokens
│   ├── .env.example                  # Client environment template
│   ├── package.json
│   ├── vercel.json                   # Client SPA routing rewrite configuration
│   └── vite.config.js
│
├── server/                           # Express Backend & SSR Service
│   ├── src/
│   │   ├── config/                   # Database, environment, constants & legacy redirects
│   │   ├── middleware/               # Auth, RBAC, error handler, rate limit, validation
│   │   ├── modules/
│   │   │   ├── activity/             # Append-only audit activity log service
│   │   │   ├── auth/                 # User model, JWT authentication, admin users
│   │   │   ├── enquiries/            # Enquiry model, inbox, AI parsing, message dispatch
│   │   │   ├── packages/             # Package model, immutable versions, seasonal pricing
│   │   │   ├── ssr/                  # SSR HTML renderer, sitemap, robots, CSP helper
│   │   │   └── stories/              # Blog story model and CMS services
│   │   ├── seed/                     # Database seed scripts with demo Kerala data
│   │   ├── utils/                    # Logger, ApiError, asyncHandler, response formatting
│   │   ├── app.js                    # Express application factory
│   │   ├── bootstrap.js              # Environment loader & DNS configuration
│   │   └── index.js                  # Server entry point
│   ├── tests/
│   │   ├── unit/                     # Isolated unit tests (SSR, models, env, AI, pricing)
│   │   ├── integration/              # Supertest integration tests against MongoDB
│   │   └── hardening/                # Security and edge-case hardening tests
│   ├── .env.example                  # Server environment template
│   └── package.json
│
├── .env.example                      # Root environment template
├── .gitignore                        # Git ignore covering all .env* variants, node_modules, dist
├── deployment.md                     # Comprehensive deployment guide
├── technical-design-document.md      # Detailed technical architecture & schema design
├── assessment-compliance.md          # Requirement-by-requirement audit matrix
├── vercel.json                       # Monorepo-level Vercel SPA rewrite configuration
└── README.md                         # This file
```

---

## 7. Local Installation & Setup

### Prerequisites
- Node.js 20+ LTS or Node.js 24
- npm 9+
- A running MongoDB instance (local or free MongoDB Atlas cluster)

### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/rahu-ul/TravelOS.git
cd TravelOS

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install
cd ..
```

---

## 8. Frontend & Backend Environment Configuration

All environment variables use strict placeholder conventions. Never commit private `.env` files to Git.

### Backend Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=YOUR_MONGODB_URI
MONGODB_DB_NAME=travelos
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=7d
CLIENT_ORIGINS=http://localhost:5173,https://travel-os-indol.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5
SEED_ADMIN_EMAIL=YOUR_ADMIN_EMAIL
SEED_ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
```

### Frontend Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
# In local development, leave blank to use the built-in Vite dev proxy (/api -> http://localhost:5000)
# In production, set to your backend deployment URL
VITE_API_URL=
```

---

## 9. Commands to Run the Complete Project Locally

### Step 1: Seed the Database (One-time)
From the `server` directory:
```bash
cd server
npm run seed
# Creates demo admin accounts, published Kerala packages, sample enquiries, and stories
```

### Step 2: Start the Backend Server
```bash
cd server
npm run dev
# Server boots at http://localhost:5000
# Health check available at http://localhost:5000/api/health
```

### Step 3: Start the Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
# Frontend boots at http://localhost:5173
# Automatically proxies /api requests to http://localhost:5000
```

---

## 10. Production Deployment Architecture

- **Frontend on Vercel:**  
  The React SPA is deployed on Vercel. Both `vercel.json` and `client/vercel.json` configure HTML5 rewrite rules (`/(.*)` &rarr; `/index.html`), preventing direct-route 404s on page refresh. In production, `VITE_API_URL` points directly to the Render backend.
- **Backend on Render:**  
  The Express service runs inside Render's web container. `trust proxy` is enabled to support secure headers behind the reverse proxy. `connectDB` explicitly sets `connectOptions.dbName = 'travelos'` to prevent defaulting to the `test` database.
- **Cross-Domain Dual Authentication:**  
  Because Vercel and Render reside on separate domains (`.vercel.app` vs `.onrender.com`), third-party cookies can be blocked by certain browser privacy settings. The backend sets `SameSite=None; Secure` cookies and also returns a Bearer token in the JSON response. The client intercepts requests and injects `Authorization: Bearer <token>`, ensuring reliable sessions across all browsers.

---

## 11. Authentication, Security & Role Management

- **Role-Based Access Control (RBAC):**  
  Defined in `server/src/config/constants.js`:
  - `traveller`: Public traveller accounts registering via `/signup`. Can submit enquiries, view personal itineraries, and manage dashboard profiles.
  - `staff_admin`: Full administrative access to the Package CMS, Blog CMS, Enquiry Inbox, Quotes Generator, and User Directory.
- **Security Protections:**
  - **NoSQL Injection:** Sanitized via `express-mongo-sanitize` to strip `$` and `.` operators.
  - **Brute-Force Protection:** Rate limiters on `/api` and `/api/auth/login` (5 login attempts per window).
  - **XSS & CSP:** Strict Helmet headers with script hashes configured for SSR theme scripts.
  - **Password Security:** Passwords hashed with `bcrypt` (salt rounds: 10).
  - **Role Guarding:** Public registration endpoints strictly forbid self-assigning administrative roles.

---

## 12. Testing Instructions & Actual Test Results

### Running Unit Tests
```bash
cd server
npx vitest run tests/unit
```
**Actual Executed Test Results:**
- **Files Passed:** 8 of 8
- **Tests Passed:** 65 of 65 (100% pass rate)
  - `ssr.render.test.js`: 16 passed
  - `models.test.js`: 16 passed
  - `packageCatalogue.test.js`: 13 passed
  - `errorHandler.test.js`: 6 passed
  - `env.test.js`: 6 passed
  - `seasonalValidation.test.js`: 4 passed
  - `ssr.test.js`: 2 passed
  - `aiService.test.js`: 2 passed

### Running Frontend Production Build
```bash
cd client
npx vite build
```
**Actual Executed Build Results:**
- Clean compilation in 677ms with zero errors.

### Note on Integration Tests
Integration test suites in `tests/integration/` and `tests/hardening/` use throwaway databases on real MongoDB instances. In sandboxed or network-restricted environments where MongoDB Atlas SRV lookups are blocked, run these tests locally against a local MongoDB instance:
```bash
cd server
MONGODB_URI=mongodb://localhost:27017/travelos_test npm test
```

---

## 13. Implemented Features, Partial Implementations & Limitations

### Fully Implemented & Verified
- Public destination guides, package listings, and day-wise detailed itineraries.
- Package CMS with draft editing, seasonal price tables, previewing, and rollback.
- Enquiry intake with reference code generation and explicit WhatsApp consent.
- Admin inbox with status workflow, assignee management, and internal notes.
- Rule-based AI extraction and database-backed package scoring.
- Branded quote builder with 5% GST calculations and printable layout.
- SSR package pages, robots.txt, sitemap.xml, and 140 legacy 301 redirects.
- Cross-domain dual authentication (Cookie + Bearer fallback).

### Partial Implementations
- **Email/WhatsApp Dispatch:** Messages and replies are marked with `deliveryStatus: 'mocked'` in development and recorded in the database rather than connecting to paid SMS/WhatsApp/SendGrid gateways.
- **Payment Processing:** Mock payment flows only; live gateway integration (Stripe/Razorpay) is intentionally out of assessment scope.
- **PDF Export:** Uses browser `window.print()` with `@media print` styling rather than a heavy server-side headless Chrome/Puppeteer service.

---

## 14. Future Improvements

1. **Live Email/WhatsApp Provider:** Connect message models to Twilio for WhatsApp Business API and Resend/SendGrid for automated itinerary confirmation emails.
2. **Headless PDF Rendering:** Implement a serverless Puppeteer microservice to generate downloadable PDF quote files with customized header branding.
3. **Advanced LLM Fallback:** Enable OpenAI/Anthropic API integration for unstructured multi-language enquiry extraction alongside the existing deterministic engine.
4. **Granular RBAC:** Expand roles to include distinct `editor` and `consultant` tiers as sketched in `constants.js`.

---

## 15. Author Information

- **Name:** Rahul Sharma
- **Academic Background:** B.Tech in Computer Science Engineering (Specialization in AI & Data Science)
- **Role:** Full-Stack Software Engineer & System Architect
- **GitHub:** [https://github.com/rahu-ul](https://github.com/rahu-ul)
- **Repository:** [https://github.com/rahu-ul/TravelOS](https://github.com/rahu-ul/TravelOS)
