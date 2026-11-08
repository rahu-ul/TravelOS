# TravelOS — Premium Kerala Travel & Tour Management Platform

Full-stack production-grade travel platform, versioned package CMS, AI-assisted enquiry processing, and enquiry inbox built for a Kochi-based Kerala and South India tour operator.

**Stack:**
- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router 7, Redux Toolkit, Axios.
- **Backend:** Node.js, Express, MongoDB Atlas + Mongoose 8, Zod, JWT (httpOnly cookies), bcrypt.
- **SSR & SEO:** Server-rendered package details, dynamic OpenGraph/meta tags, JSON-LD schema, robots.txt, sitemap.xml, 140 legacy redirects.
- **AI Processing:** Async requirements extraction, top-3 published package recommendations, and draft response generation with human-in-the-loop consultant approval.

---

## Quick Start

### 1. Setup Environment
```bash
# In repository root
npm run install:all
```
Ensure `.env` in root contains:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=0ff13fbac5b14d81c59344dc5bc48d92bf25c6e742ad12df4f17a475b8f5ace0b698f620a8f407188766c79730aefe41
CLIENT_ORIGIN=http://localhost:5173
LLM_PROVIDER=mock
```

### 2. Run Database Seed (Development)
```bash
cd travelos/server
npm run seed
```
Seeds users, PKG-KL-07 (published), PKG-SI-12 (draft), demo enquiries, and demo stories.

### 3. Run Development Servers
```bash
# Terminal 1 — Backend API (port 5000)
cd travelos/server
npm run dev

# Terminal 2 — Frontend SPA & Admin Portal (port 5173)
cd travelos/client
npm run dev
```

Visit:
- **Public Website:** `http://localhost:5173`
- **Staff Admin CMS & Inbox:** `http://localhost:5173/admin/login`

---

## Demo Credentials (Development)

Password for all seeded accounts: `TravelOS_Demo_2026!` (or `SEED_DEFAULT_PASSWORD` in `.env`)

| Email | Role | Access |
|---|---|---|
| `admin@travelos.example` | `staff_admin` | Full Package CMS, Versioning, Publish, Enquiry Inbox |
| `consultant@travelos.example` | `staff_admin` | Enquiry Inbox, AI Assistant, Reply Approvals, Notes |
| `traveller@travelos.example` | `traveller` | Public browsing only |

---

## Implemented Workflows & Architecture

### 1. Public Kerala Travel Website
- **Homepage (`/`):** Cinematic Kerala hero, real-time search widget (destination, month, travellers), brand editorial philosophy, destination grid, featured packages, experience tabs, field travel stories, and demo testimonials.
- **Package Listing (`/packages`):** Multi-facet filtering (search, duration buckets, hotel star rating, region, price sorting) with pagination.
- **Package Details (`/packages/:slug`):** Authoritative backend pricing, twin-sharing adult basis, GST notices, day-by-day itinerary accordion, hotel inclusions/exclusions, gallery, and enquiry CTA.
- **Enquiry Form (`/contact`):** Real-time backend submission to `POST /api/enquiries`, Zod validation, rate limiting, duplicate submission prevention, and explicit DPDP WhatsApp consent recording.

### 2. Versioned Package CMS (`/admin/packages`)
- **Immutable Published Versions:** Historical published packages cannot be modified directly.
- **Draft Isolation:** Updates create or modify an isolated draft with an optimistic concurrency `revision` counter. Only 1 active draft per package is allowed (enforced via database partial unique index).
- **Seasonal Pricing Engine:** Non-overlapping calendar dates validation, integer rupee prices, twin-sharing basis, and GST disclosure.
- **Draft Preview:** Safely inspect unpublished drafts without exposing them to public routes.
- **Version History & Restoration:** Full version audit trail with "Restore as New Draft".
- **Duplicate Package:** Clone existing packages into new drafts.

### 3. Centralized Enquiry Inbox & AI Assistant (`/admin/enquiries`)
- **Status Pipeline:** Filter by `new`, `contacted`, `quoted`, `won`, `lost`.
- **SLA Overdue Indicator:** Highlights enquiries unanswered for >1 hour during business hours.
- **AI Extraction:** Extracts destination, dates, adults, kids, duration, budget, and must-haves from customer message.
- **Consultant Correction:** Staff can edit and save corrected requirements (`staffCorrected`).
- **AI Package Recommendations:** Selects top 3 published packages from real database records with ranked fit reasons. No hallucinated packages or prices.
- **Human-in-the-Loop Reply Approval:** Pre-fills polite response with real prices; consultant edits and clicks **Approve & Send Reply**.
- **Internal Notes:** Consultant timeline for phone notes and status updates.

### 4. SSR, SEO & Legacy Redirects
- **Server-Side Rendered Package Pages:** `GET /ssr/packages/:slug` serves HTML with OpenGraph tags, meta description, and JSON-LD `TouristTrip` structured data.
- **140 Legacy URL Redirects:** 301 permanent redirects mapping historic URLs (e.g. `/kerala-houseboats` -> `/packages/munnar-thekkady-alleppey-houseboat`).
- **SEO Endpoints:** `GET /robots.txt` and `GET /sitemap.xml` dynamically generated from published packages.
