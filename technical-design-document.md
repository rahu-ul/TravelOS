# TravelOS – Technical Design Document

**Author:** Rahul Sharma (B.Tech – Computer Science Engineering, AI & Data Science)  
**GitHub Repository:** [https://github.com/rahu-ul/TravelOS](https://github.com/rahu-ul/TravelOS)  
**Production Frontend:** [https://travel-os-indol.vercel.app/](https://travel-os-indol.vercel.app/)  
**Production Backend:** [https://travelos-backend-ksib.onrender.com](https://travelos-backend-ksib.onrender.com)  

---

## 1. Problem Statement

Boutique tour operators in regional markets like Kerala face unique operational hurdles:
1. **Catalog Rigidity:** Tour packages change frequently across high and monsoon seasons, but existing generic CMS platforms do not support seasonal pricing structures, twin-sharing occupancy rules, or draft-publish revision tracking with audit histories.
2. **Slow Response Times:** Inquiries arriving via email, phone, and website forms require manual triage, extraction of party sizes and budget constraints, and manual matching against available itineraries, leading to response times exceeding 24–48 hours.
3. **Fragmented Workflows:** Sales consultants often generate quotations in spreadsheets, manage follow-ups in personal email threads, and maintain customer notes informally, causing lost leads and billing errors.
4. **Search Discoverability & Legacy Debt:** Migrating an established tour business with existing organic rankings requires preserving 100+ legacy URLs, providing pre-rendered HTML for search crawlers, and ensuring sub-2.5 second page load speeds without sacrificing modern client-side interactivity.

---

## 2. Proposed Solution

**TravelOS** is a modular web application that combines a customer-facing discovery website, an administrative package CMS, an enquiry triage pipeline, and an AI-assisted recommendation engine.

Key architectural pillars:
- **Dual-Surface Architecture:** Server-Side Rendering (SSR) for public package pages ensuring instant SEO indexing and Open Graph crawlers, paired with a React 18 Single-Page Application (SPA) for staff administration and interactive traveller discovery.
- **Authoritative Seasonal Pricing:** Package versions store seasonal rates as integer rupees; pricing calculations, GST assessments, and validations reside strictly in the backend, eliminating AI-invented or hallucinated rates.
- **Deterministic AI Assistance with Human Approval:** Customer inquiries are processed by a deterministic extraction engine and scored against live database records. Suggested recommendations and draft replies are always reviewed and approved by staff before sending.
- **Append-Only Audit Logging:** Administrative actions (package publishing, draft edits, version rollbacks, enquiry assignments, and reply approvals) are recorded in an immutable activity ledger.

---

## 3. Functional and Non-Functional Requirements

### Functional Requirements
- **Public Website:** Browse packages by destination, duration, hotel category, and budget; view day-wise itineraries, hotels, inclusions, and photo galleries; submit enquiries with DPDP and WhatsApp consent.
- **Package CMS:** Create package drafts, manage non-overlapping seasonal pricing tables, preview draft versions, publish immutable snapshots, duplicate packages, and restore prior versions.
- **Blog CMS:** Manage travel stories, assign tags, link related tour packages, and publish editorial content.
- **Enquiry Management:** Centralized inbox with status tracking (`new`, `contacted`, `quoted`, `won`, `lost`), 1-hour SLA overdue alerts, consultant assignment, and internal notes.
- **AI Processing:** Extract travel party size, budget, and destination from unstructured customer notes; score published packages; generate personalized draft replies.
- **Branded Quotations:** Generate customer-facing quotes with dynamic 5% GST computation and PDF print styling.

### Non-Functional Requirements
- **Performance:** Sub-2.5 second Largest Contentful Paint (LCP) on 4G connections through lightweight asset bundles and SSR pre-rendering.
- **Security:** NoSQL injection prevention, rate limiting on authentication and enquiry endpoints, HTTP-only secure cookie sessions with fallback Bearer tokens for cross-domain deployments, and Content Security Policy (CSP).
- **SEO & Discoverability:** Canonical tags, Open Graph meta tags, JSON-LD Schema.org `TourPackage` metadata, XML sitemaps, robots.txt, and 140 legacy 301 redirects.

---

## 4. Overall System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   Client Browser                       │
                    └───────────┬────────────────────────────────┬───────────┘
                                │                                │
                      HTML/Asset Requests                 REST API Calls
                                │                         (Dual Auth)
                                ▼                                ▼
              ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
              │          Vercel Edge              │    │          Render Service           │
              │   (React 18 SPA + Static CSS)     │    │      (Node.js / Express 4)        │
              │   - Client-side Routing           │    │  ┌─────────────────────────────┐  │
              │   - Tailwind CSS Assets           │    │  │ Middleware:                 │  │
              │   - Redux Toolkit State           │    │  │ - Helmet & Custom CSP       │  │
              └───────────────────────────────────┘    │  │ - CORS Allowlist            │  │
                                                       │  │ - Rate Limiter              │  │
                                                       │  │ - Mongo Sanitize            │  │
                                                       │  │ - Authenticate (Cookie/JWT) │  │
                                                       │  └──────────────┬──────────────┘  │
                                                       │                 ▼                 │
                                                       │  ┌─────────────────────────────┐  │
                                                       │  │ Modules:                    │  │
                                                       │  │ - /api/packages & CMS       │  │
                                                       │  │ - /api/enquiries & AI       │  │
                                                       │  │ - /api/stories (Blog)       │  │
                                                       │  │ - /api/auth & RBAC          │  │
                                                       │  │ - /ssr & 140 Legacy Redir   │  │
                                                       │  └──────────────┬──────────────┘  │
                                                       └─────────────────┼─────────────────┘
                                                                         │
                                                                         ▼
                                                       ┌───────────────────────────────────┐
                                                       │       MongoDB Atlas Cluster       │
                                                       │       Database: travelos          │
                                                       └───────────────────────────────────┘
```

---

## 5. Frontend Architecture

The frontend is built using **React 18** and bundled with **Vite 5**.

- **Routing:** Handled by `react-router-dom` v6. Configured with public routes (`/`, `/destinations`, `/packages`, `/packages/:slug`, `/stories`, `/stories/:slug`, `/contact`, `/about`, `/login`, `/signup`, `/dashboard`) and protected admin routes (`/admin`, `/admin/packages`, `/admin/enquiries`, `/admin/quotes`, `/admin/stories`).
- **State Management:** **Redux Toolkit** (`src/app/store.js`) manages user session persistence (`authSlice.js`). Local component state manages form inputs and interactive modal drawers.
- **HTTP Layer:** Centralized in `src/api/client.js`. A custom Axios instance dynamically resolves `baseURL` (using `VITE_API_URL` in production or `/api` proxy in development), attaches `Authorization: Bearer <token>` from `localStorage`, and persists tokens upon login.
- **Styling:** **Tailwind CSS v4** utilizing an editorial palette:
  - Sand (`#EFECE6`), Cream (`#F7F5F0`), Charcoal (`#1F2421`), Forest Green (`#1E3F20`), Ochre Gold (`#C88A2C`).
  - Full Dark/Light theme switching supported via `ThemeProvider.jsx` and CSS root variables.

---

## 6. Backend Architecture

The backend is structured as a **modular monolith** in Express 4:

- **Factory Pattern (`src/app.js`):** The `createApp()` function isolates Express setup from database connections, enabling clean unit testing without open port bindings.
- **Module Separation (`src/modules/`):**
  - `auth`: Handles user registration, credentials hashing, JWT issuance, and user listing.
  - `packages`: Manages package catalogue queries, faceted filter calculation, draft editing, and publishing.
  - `enquiries`: Handles public enquiry intake, rule-based AI parsing, automated scoring, consultant assignment, and reply approvals.
  - `stories`: Manages editorial travel articles, tagging, and cross-linking to published packages.
  - `activity`: Append-only audit logging for system actions.
  - `ssr`: Renders pre-compiled HTML templates for package detail pages, robots.txt, and sitemap.xml.
- **Error Handling (`src/middleware/errorHandler.js`):** Standardizes all client responses into `{ success: false, error: { message, code, details } }`.

---

## 7. Database Design & Schemas

The database layer utilizes **MongoDB Atlas** via **Mongoose 8**.

### `User` Collection (`user.model.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['traveller', 'staff_admin'], default: 'traveller' },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

### `Package` Collection (`package.model.js`)
Stores the package identity and fast listing projection:
```javascript
{
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g. PKG-KL-07
  slug: { type: String, required: true, unique: true, lowercase: true },
  draftVersionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion' },
  publishedVersionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion' },
  listing: {
    name: String,
    destination: String,
    durationDays: Number,
    nights: Number,
    startingPrice: Number,
    heroImage: { url: String, alt: String },
    hotelCategory: String,
    publishedAt: Date
  }
}
```

### `PackageVersion` Collection (`packageVersion.model.js`)
Stores versioned content snapshots:
```javascript
{
  packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  status: { type: String, enum: ['draft', 'published'], required: true },
  versionNumber: { type: Number, required: true },
  revision: { type: Number, default: 0 },
  changeNote: String,
  content: {
    name: String,
    destination: String,
    durationDays: Number,
    nights: Number,
    hotelCategory: String,
    summary: String,
    description: String,
    itinerary: [{ day: Number, title: String, description: String }],
    hotels: [{ name: String, location: String, category: String, nights: Number }],
    inclusions: [String],
    exclusions: [String],
    heroImage: { url: String, alt: String },
    gallery: [{ url: String, alt: String }],
    location: { label: String, lat: Number, lng: Number },
    seo: { title: String, description: String, canonicalUrl: String }
  },
  seasons: [{
    name: String,
    startDate: Date,
    endDate: Date,
    pricePerPerson: Number, // Integer rupees
    occupancyBasis: { type: String, enum: ['single', 'double', 'triple', 'family'], default: 'double' },
    gstIncluded: Boolean,
    currency: { type: String, default: 'INR' }
  }],
  publishedAt: Date,
  publishedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}
```

### `Enquiry` Collection (`enquiry.model.js`)
Tracks the lifecycle of traveller inquiries:
```javascript
{
  reference: { type: String, unique: true, immutable: true }, // e.g. ENQ-2026-XXXX
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  packageId: { type: Schema.Types.ObjectId, ref: 'Package' },
  destination: String,
  travelStart: Date,
  travelEnd: Date,
  adults: { type: Number, required: true, min: 1 },
  children: { type: Number, default: 0 },
  budget: { amount: Number, currency: { type: String, default: 'INR' } },
  requirements: String,
  message: { type: String, required: true },
  whatsappConsent: { type: Boolean, default: false },
  source: { type: String, enum: ['website', 'phone', 'whatsapp', 'email', 'walk_in'], default: 'website' },
  status: { type: String, enum: ['new', 'contacted', 'quoted', 'won', 'lost'], default: 'new' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  firstResponseAt: Date,
  notes: [{
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    body: String,
    createdAt: Date
  }],
  extracted: {
    ai: { adults: Number, children: Number, destination: String, nightsMin: Number, nightsMax: Number, travelPeriod: String, budgetInr: Number, mustHaves: [String] },
    staffCorrected: { ... },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  },
  ai: {
    status: { extract: String, recommend: String, draft: String },
    recommendations: [{
      packageId: { type: Schema.Types.ObjectId, ref: 'Package' },
      versionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion' },
      reason: String
    }],
    draftReply: { subject: String, body: String, generatedAt: Date }
  }
}
```

---

## 8. Database Collections and Relationships

```
┌──────────────────────┐         1:N         ┌───────────────────────────────┐
│       Package        │ ──────────────────> │        PackageVersion         │
│  - code (unique)     │                     │  - packageId (FK)             │
│  - slug (unique)     │                     │  - status (draft | published) │
│  - draftVersionId    │ <────────────────── │  - versionNumber              │
│  - publishedVersionId│         1:1         │  - seasons[] (pricing table)  │
└──────────┬───────────┘                     └───────────────────────────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐         1:N         ┌───────────────────────────────┐
│       Enquiry        │ ──────────────────> │            Message            │
│  - reference         │                     │  - enquiryId (FK)             │
│  - customer {}       │                     │  - type (acknowledgement|reply│
│  - assignedTo (User) │                     │  - approvedBy (User FK)       │
│  - extracted {}      │                     │  - deliveryStatus (mocked)    │
│  - notes []          │                     └───────────────────────────────┘
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐
│       Activity       │
│  - actorId (User FK) │
│  - action            │
│  - entityType/Id     │
└──────────────────────┘
```

---

## 9. API Architecture & Important Endpoints

### Public Endpoints
- `GET /api/health` — System status, uptime, and database connection state.
- `GET /api/packages` — Paginated published packages with faceted filtering (`destination`, `duration`, `hotelCategory`, `minPrice`, `maxPrice`, `sort`).
- `GET /api/packages/filters` — Aggregated filter facets computed from active inventory.
- `GET /api/packages/:slug` — Published package details including seasonal pricing and itinerary.
- `POST /api/enquiries` — Public enquiry submission with rate limiting (10 submissions/hour/IP).
- `GET /api/stories` & `GET /api/stories/:slug` — Published editorial stories.

### Authentication Endpoints
- `POST /api/auth/register` — Traveller registration (strictly assigns `traveller` role).
- `POST /api/auth/login` — User authentication; sets `travelos_jwt` cookie and returns `{ user, token }`.
- `POST /api/auth/logout` — Clears authentication cookie.
- `GET /api/auth/me` — Returns the authenticated session profile.

### Admin Endpoints (Requires `staff_admin` role)
- `GET /api/admin/packages` — Complete package catalogue including drafts and published states.
- `POST /api/admin/packages` — Create new package with draft version.
- `PUT /api/admin/packages/:id/draft` — Update draft content with optimistic locking.
- `POST /api/admin/packages/:id/publish` — Publish draft into an immutable snapshot.
- `POST /api/admin/packages/:id/duplicate` — Duplicate package into a new draft.
- `POST /api/admin/packages/:id/restore/:versionId` — Rollback previous version into current draft.
- `GET /api/admin/enquiries` — Inbox list with status, assignee, and SLA filters.
- `PATCH /api/admin/enquiries/:id/assign` — Assign enquiry to a consultant.
- `PATCH /api/admin/enquiries/:id/status` — Advance enquiry lifecycle status.
- `POST /api/admin/enquiries/:id/notes` — Add internal staff note.
- `POST /api/admin/enquiries/:id/reply` — Approve and dispatch draft reply.
- `GET /api/admin/stories` & `POST /api/admin/stories` — Staff Story CMS management.

### SSR & SEO Endpoints
- `GET /ssr/packages/:slug` — Full server-rendered HTML for search crawlers.
- `GET /robots.txt` & `GET /sitemap.xml` — Dynamically generated search engine metadata.

---

## 10. Authentication and Role-Based Access Control

The platform enforces Role-Based Access Control (RBAC):
- **Roles:**
  - `traveller`: Registered public travellers. Access limited to their own enquiries and profile.
  - `staff_admin`: Internal staff with permissions:
    `packages:read`, `packages:write`, `packages:publish`, `enquiries:read`, `enquiries:write`, `stories:write`, `users:read`.
- **Dual Authentication Mechanism:**
  - Standard browsers store the token in an `httpOnly`, `SameSite=None`, `Secure` cookie named `travelos_jwt`.
  - To bypass third-party cookie restrictions between separate Vercel and Render domains, login responses also return the raw token.
  - The client persists this token in `localStorage` and attaches `Authorization: Bearer <token>` to requests.
  - Middleware inspects: `req.cookies.travelos_jwt || req.headers.authorization`.

---

## 11. Package CMS Workflow

1. **Drafting:** A package starts with a mutable `draftVersion`. Authors edit content, destinations, itinerary days, hotels, and seasonal rates.
2. **Optimistic Locking:** Draft saves pass a `revision` counter. If the database revision exceeds the client's revision, an edit conflict is returned.
3. **Seasonal Validation:** Before saving or publishing, the system validates that season date ranges do not overlap, end dates occur on or after start dates, and prices are non-negative integer rupees.
4. **Publishing:** Publishing marks the current draft as `published`, increments `versionNumber`, updates `publishedVersionId` on the parent package, and refreshes the fast `listing` projection.
5. **Rollback & Restore:** Restoring a historic version clones that snapshot's content and seasons into a new active draft without altering historic records.

---

## 12. Blog CMS Workflow

1. **Creation:** Staff create stories with title, summary, markdown/rich content, cover image, and category tags.
2. **Slug Generation:** Automatic slug generation converts titles into URL-safe identifiers (`/stories/monsoon-ayurveda-guide`).
3. **Cross-Linking:** Authors can select related published packages (e.g., associating a Munnar tea story with the 6-Day Kerala package).
4. **Publishing:** Toggling publication controls visibility in the public `/stories` feed and sitemap.xml.

---

## 13. Enquiry Management Workflow

```
[Traveller Submits Form]
       │
       ▼
[Create Enquiry (Status: 'new')] ──> [Issue ENQ-XXXX Ref] ──> [Deterministic AI Extraction]
       │                                                                  │
       │                                                                  ▼
       │                                                     [Query DB & Score Packages]
       │                                                                  │
       │                                                                  ▼
       │                                                     [Generate Draft Reply]
       ▼
[Inbox Notification (Overdue Alert if Unanswered > 1hr)]
       │
       ├─► [Assign to Consultant]
       ├─► [Add Internal Team Notes]
       ├─► [Correct AI Extracted Parameters]
       └─► [Review, Edit & Approve Draft Reply]
                 │
                 ▼
       [Save Message (Status: 'contacted')] ──> [Log Activity]
```

---

## 14. Quote Generation Workflow

1. Staff navigate to `/admin/quotes`.
2. Select a target traveller and choose an active package from the live database.
3. The system pulls authoritative seasonal rates and populates the base rate per person.
4. The consultant inputs the number of guests, custom inclusions, and validity window.
5. Real-time client calculations compute:
   $$\text{Subtotal} = \text{Rate Per Person} \times \text{Guests}$$
   $$\text{GST Amount} = \text{Subtotal} \times 0.05 \quad (5\% \text{ Indian Tour Package GST})$$
   $$\text{Grand Total} = \text{Subtotal} + \text{GST Amount}$$
6. The user clicks **Print / Save as PDF**, triggering browser print engines configured with `@media print` stylesheets that strip navigation bars and format the quote as a formal document.

---

## 15. AI Enquiry Processing & Recommendation Workflow

The AI engine (`server/src/modules/enquiries/ai.service.js`) is strictly deterministic and hallucination-free:

1. **Extraction:**
   - Unstructured text (e.g. *"2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh, houseboat a must"*) is evaluated against regex patterns and keyword dictionaries.
   - Extracts: `adults: 2`, `children: 1`, `nightsMin: 5`, `nightsMax: 6`, `destination: "Kerala"`, `budgetInr: 120000`, `mustHaves: ["Houseboat stay"]`.
2. **Live Database Scoring:**
   - Queries `Package.find({ publishedVersionId: { $ne: null } })`.
   - Computes weighted score based on destination match (+30), duration match (+25), must-have keyword matches (+20), and budget alignment (+20).
   - Never hallucinates prices; rates are pulled directly from `packageVersion.seasons`.
3. **Draft Reply Generation:**
   - Formats a professional proposal addressed to the customer, presenting the top 3 packages with actual starting rates and transparent itineraries.

---

## 16. Human Approval Process

- AI never communicates directly with customers.
- Extracted travel criteria are stored in `enquiry.extracted.ai`.
- When staff adjust criteria, corrections are saved in `enquiry.extracted.staffCorrected` alongside `reviewedBy` and `reviewedAt`.
- The draft reply is loaded into an editable text area in `AdminEnquiriesPage.jsx`. Staff can revise the text before clicking **Approve & Send**.
- Approving records the reply in the `Message` collection and logs an `enquiry.reply_approved` entry in the `Activity` ledger.

---

## 17. Pricing & Seasonal Pricing Logic

- **Authority:** The backend is the sole authority on package pricing.
- **Data Representation:** Prices are stored as whole integer rupees (`Number.isInteger`). Floating point currency representation is forbidden to prevent rounding drift.
- **Seasons Table:** Each season specifies `startDate`, `endDate`, `pricePerPerson`, and `occupancyBasis` (default: `double` / twin-sharing).
- **GST Compliance:** Indian regulations mandate 5% GST on tour packages without Input Tax Credit (ITC). The quote generator and package detail pages explicitly declare GST status (`gstIncluded: false` by default, calculated transparently).

---

## 18. Security & Privacy Considerations

- **Digital Personal Data Protection (DPDP) Act Compliance:**
  - Enquiries collect only required contact details.
  - Explicit boolean flag (`whatsappConsent: true/false`) captures traveller consent before communications are initiated.
- **NoSQL Injection Defense:** `express-mongo-sanitize` strips `$` and `.` characters from incoming request bodies.
- **Brute Force Defense:** `express-rate-limit` enforces a 5-request limit per 15-minute window on `/api/auth/login`.
- **Content Security Policy (CSP):** Helmet sets strict default directives. For SSR pages with inline theme initialization scripts, a SHA-256 script hash is injected into `script-src`.

---

## 19. Deployment Architecture

- **Frontend (Vercel):** Serves pre-compiled production SPA assets across edge nodes. `vercel.json` rewrite rules direct all non-asset requests to `index.html`.
- **Backend (Render):** Dockerized Node.js Web Service running in Singapore/Frankfurt regions. Reverse proxy handles TLS termination, with Express configured for `trust proxy = 1`.
- **Database (MongoDB Atlas):** Managed replica set providing automated backups and secure TLS connections.

---

## 20. Testing Strategy

```
┌────────────────────────────────────────────────────────┐
│                      Test Pyramid                      │
│                                                        │
│                  Integration Tests                     │
│            (Supertest + Real MongoDB)                  │
│       - Auth flows, RBAC matrix, Public APIs           │
│                                                        │
│                 Isolated Unit Tests                    │
│            (Vitest - 8 files, 65 tests)                │
│       - SSR rendering, Model validation, Pricing logic │
│       - AI rule-based extractor, Error handling        │
└────────────────────────────────────────────────────────┘
```

- **Unit Tests:** Fast, isolated tests executing without network dependencies. Verified: 8 files, 65 tests passing.
- **Integration Tests:** Execute Supertest HTTP requests against isolated throwaway MongoDB databases (`tests/integration/`).
- **Build Verification:** Client production build verified via Vite compiling cleanly in under 1 second.

---

## 21. Known Limitations

1. **Sandboxed Network Constraints:** Integration tests that perform MongoDB Atlas SRV lookups require direct network connectivity or a local MongoDB service; they are skipped in sandboxed offline CI environments.
2. **Mock Message Delivery:** Confirmation emails and WhatsApp notifications are saved to the database with `deliveryStatus: 'mocked'` rather than calling third-party communication APIs.
3. **Client-Side PDF Generation:** Quotations utilize the browser print driver (`window.print()`) rather than a dedicated backend headless Chrome instance.

---

## 22. Future Improvements

1. **Multi-Currency Support:** Support dynamic currency conversions (USD, EUR, GBP, AED) based on daily exchange rates.
2. **Headless Chrome PDF Service:** Server-side PDF generation producing downloadable quotation attachments.
3. **Live WhatsApp Business Integration:** Connect the `Message` model to the official WhatsApp Cloud API for two-way chat.
4. **Enhanced Traveller Portal:** Allow authenticated travellers to review past itineraries, upload identity documents, and track booking statuses.

