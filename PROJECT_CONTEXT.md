# TravelOS - Project Context

Hiring assignment: public travel website + staff CMS + enquiry management + AI-assisted enquiry processing for a Kochi tour operator. JavaScript only. Modular monolith. Seven-day scope. Work proceeds in phases; do not start a phase until the previous one is verified.

## Stack
Client: React, Vite, JSX, Tailwind CSS 4, React Router, Redux Toolkit, Axios.
Server: Node, Express 4, MongoDB (Atlas) + Mongoose 8, Zod, JWT (httpOnly cookie), bcrypt, Helmet, CORS allow-list, express-rate-limit, express-mongo-sanitize.
Tests: Vitest + Supertest (real MongoDB, throw-away databases).

## Approved decisions and assumptions
- One Express process will serve API, SSR HTML for public routes and static assets; admin is a client-rendered SPA.
- Versioning: `packages` (identity + pointers + `listing` projection) and `packageVersions` (draft/published snapshots). One draft per package is enforced by a partial unique index. Published versions are immutable (model hooks). Restore copies into a new draft. Drafts use a `revision` counter for optimistic concurrency.
- Prices live only in `packageVersions.seasons[]` as integer rupees; the backend is the price authority. AI never produces prices.
- A. Brief packages 1 and 2 are ONE package (PKG-KL-07) with two seasons (Peak Oct-Mar 32,500; Monsoon Jun-Sep 24,900). B. Seasons use absolute dates (peak 2026-10-01 to 2027-03-31; monsoon 2027-06-01 to 2027-09-30). C. PKG-SI-12 is seeded as a draft only. D. Prices are per person (adult basis); no child fare. E. Traveller role exists but there is no traveller sign-up in v1. G. Testimonials/stories are demo content. H. LLM provider is configurable with a mock default.
- Auth: JWT in httpOnly, SameSite=Lax cookie; role->permission map in `server/src/config/constants.js` (Editor/Consultant roles can be added by adding map entries).
- Models (collections): User, Package, PackageVersion, Enquiry (notes embedded), Message, Activity (append-only), Story (blog).

## Blog CMS requirement (recorded)
TravelOS needs a basic staff-managed blog CMS. The `Story` model (title, slug, body, cover image, tags, draft/published status, SEO fields, related packages, `isDemo`) and seeded demo stories exist from Phase 1. Staff CRUD for stories (admin screens + `/api/admin/stories` endpoints, `stories:write` permission, activity logging) and the public stories pages are on the roadmap in Phase 3 (admin) and Phase 2 (public read).

## Checklist
- [x] Phase 0: architecture approved
- [x] Phase 1: structure, backend foundation, 7 models, auth, seed, tests, client scaffold
- [x] Phase 2: public website, SSR, enquiry form, public stories pages
  - [x] M1 homepage  - [x] M2 listing  - [x] M3 detail  - [x] M4 enquiry form  - [x] M5 stories  - [x] M6 SSR + SEO  - [x] M7 responsive/QA
- [x] Phase 3: package CMS (drafts, seasonal pricing validation, preview, publish, history, restore, duplication)
- [x] Phase 4: centralized enquiry management & staff inbox (status pipeline, assignment, internal notes)
- [x] Phase 5: AI enquiry assistant (requirements extraction, top-3 package matching, draft reply, consultant approval workflow)
- [x] Phase 6: SSR endpoints, sitemap.xml, robots.txt, 140 legacy redirects, unit testing, documentation

## Phase 1 verification (this environment)
- Server tests: 10 files, 116 tests passing against a real MongoDB 8.x (`npm test`).
- Seed run against MongoDB: 3 users, 2 packages, 2 versions, 4 enquiries, 4 stories, 10 activities.
- Live curl checks: login (200 + httpOnly cookie), wrong password (401), /me with and without cookie (200/401), /admin/users as staff (200) and as traveller (403), logout clears cookie, Vite dev proxy reaches API.
- Client `vite build` succeeds.
- NOT verified: connection to MongoDB Atlas (no Atlas access from the build sandbox); run `npm run seed` and `npm test` against your Atlas URI.

## Known issues / notes
- Seasonal overlap validation is a Phase 3 service concern (model only checks end >= start).
- ARCHITECTURE.md, API_DOCUMENTATION.md and deployment.md are written in later phases.

## Phase 2 - Step 0: public backend APIs (added)
Public, read-only, no auth. All business logic is in services that SSR will call directly (no internal HTTP).
| Method | Path | Notes |
|---|---|---|
| GET | /api/packages | Published packages only. Query: `q, destination, duration (csv of 1-2,3-4,5-6,7-9,10+), hotelCategory (csv), minPrice, maxPrice, month (1-12), sort (recommended, price_asc, price_desc, duration), page, limit (default 6, max 48)`. Invalid values are ignored, not rejected. Returns `{ data: { packages: [card] }, meta: { page, limit, total, totalPages } }` |
| GET | /api/packages/filters | Facets computed from published data: destinations, durations, hotelCategories, months, price range |
| GET | /api/packages/:slug | Published version only; 404 for drafts/unknown/malformed. Includes seasons (price per person, occupancy, GST), itinerary, hotels, gallery, location, SEO, related |
| GET | /api/stories | Published stories only. Query: `page, limit, tag` |
| GET | /api/stories/:slug | Published only; includes related published packages and more stories |
| POST | /api/enquiries | Public. Zod-validated (`enquiries.validation.js`), saved BEFORE any AI step, 10/hour/IP limit, 10-minute duplicate guard (same email + message + package returns the same reference with 200). Returns `{ reference, receivedAt, duplicate }` |

Files: `server/src/modules/packages/{packageCatalogue,packages.service,packages.validation,packages.controller,packages.routes}.js`, `modules/stories/stories.{service,validation,routes}.js`, `modules/enquiries/enquiries.{validation,service,routes}.js`. `packageCatalogue.js` is pure (no imports) and unit-tested.

Decisions:
- Filtering/sorting/pagination run in memory over published packages (one query for packages, one for their published versions). Fine for a tour operator catalogue (tens to low hundreds); move to an aggregation if it grows.
- Schema change (additive): `Package.isDemo` (Boolean, default false) so the site can badge placeholder packages. No index or existing field changed.
- The Enquiry model requires `message`; the form has "special requirements". If requirements is under 5 chars the server composes a message from the structured fields the visitor entered.
- Demo data: `seed/data/packages.demo.js` adds 8 published DEMO packages (placeholder prices, flagged `isDemo`, one with no seasons to show "Price on request"). PKG-KL-07 keeps the brief's prices; PKG-SI-12 stays a draft.
- Demo images: crops of the design mockups in `client/public/images/seed/` and `client/public/images/hero-kerala.jpg` (low resolution). Replace with real photography / Cloudinary.

## Known limitations (Step 0)
- Written without the ability to run npm/MongoDB; verify locally with the commands in the Phase 2 hand-off (tests, seed, curl).
- Stories `body` is plain text (paragraphs split on blank lines); rich content/Markdown arrives with the blog CMS.
