# TravelOS – Production Deployment & Local Setup Guide

**Author:** Rahul Sharma (B.Tech – Computer Science Engineering, AI & Data Science)  
**GitHub Repository:** [https://github.com/rahu-ul/TravelOS](https://github.com/rahu-ul/TravelOS)  
**Frontend Deployment (Vercel):** [https://travel-os-indol.vercel.app/](https://travel-os-indol.vercel.app/)  
**Backend Deployment (Render):** [https://travelos-backend-ksib.onrender.com](https://travelos-backend-ksib.onrender.com)  

---

## 1. Local Development Architecture

During local development:
- **Frontend:** Runs via the Vite development server on `http://localhost:5173`. The `vite.config.js` proxy automatically forwards `/api` requests to `http://localhost:5000`.
- **Backend:** Runs via Node.js with Nodemon on `http://localhost:5000`.
- **Session:** Cookies operate locally with `sameSite: 'lax'` and `secure: false`.

```
[Browser: http://localhost:5173]
       │
       ├─► Static JSX / CSS Assets (Vite Dev Server :5173)
       │
       └─► /api/* (Vite Proxy) ──► [Express Backend :5000] ──► [MongoDB Atlas / Local DB]
```

---

## 2. Frontend Setup (Vite + React)

1. Open a terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Prepare the local environment file:
   ```bash
   cp .env.example .env
   ```
   *Note: For local development, leave `VITE_API_URL` empty so that Vite uses its local reverse proxy to forward `/api` requests to `localhost:5000`.*
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Build for production locally to verify bundle health:
   ```bash
   npm run build
   ```

---

## 3. Backend Setup (Node.js + Express)

1. Open a second terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Create your local `.env` file from the provided template:
   ```bash
   cp .env.example .env
   ```
4. Run initial database seeding to populate demo Kerala packages, users, and stories:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
6. Verify server health:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response: `{"success":true,"data":{"status":"ok","db":"connected",...}}`

---

## 4. MongoDB Atlas Configuration

1. Create a free M0 cluster on [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Database Access**:
   - Create a database user (e.g., `travelos_admin`) with `readWriteAnyDatabase` permissions.
3. Under **Network Access**:
   - Add IP Access `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render's dynamic IP ranges, or add Render outbound IP blocks.
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/travelos?retryWrites=true&w=majority
   ```
   *Ensure the database name `travelos` is included in the URI path.*

---

## 5. Environment Variables Reference

All variables discovered and actively used by the codebase are listed below with strict placeholders:

### Backend Variables (`server/.env`)
| Variable Name | Environment | Example / Format | Purpose |
|---|---|---|---|
| `PORT` | All | `5000` (Local) / `10000` (Render) | Server port |
| `NODE_ENV` | All | `development` / `production` | Runtime mode toggle |
| `MONGODB_URI` | All | `YOUR_MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | All | `travelos` | Explicit target database name |
| `JWT_SECRET` | All | `YOUR_JWT_SECRET` | 64-char random hex string for JWT signing |
| `JWT_EXPIRES_IN` | All | `7d` | Token lifetime |
| `CLIENT_ORIGINS` | All | `http://localhost:5173,https://travel-os-indol.vercel.app` | Comma-separated CORS allowed origins |
| `RATE_LIMIT_WINDOW_MS` | Optional | `900000` (15 mins) | Window size for general rate limiting |
| `RATE_LIMIT_MAX` | Optional | `100` | Max requests per IP per window |
| `LOGIN_RATE_LIMIT_MAX` | Optional | `5` | Max login attempts per IP per window |
| `SEED_ADMIN_EMAIL` | Optional | `YOUR_ADMIN_EMAIL` | Administrator email for seeding |
| `SEED_ADMIN_PASSWORD` | Optional | `YOUR_ADMIN_PASSWORD` | Administrator password for seeding |

### Frontend Variables (`client/.env`)
| Variable Name | Environment | Value | Purpose |
|---|---|---|---|
| `VITE_API_URL` | Local | *(empty string)* | Uses Vite proxy `/api` |
| `VITE_API_URL` | Production | `https://travelos-backend-ksib.onrender.com` | Base backend URL for production Axios client |

---

## 6. Vercel Frontend Deployment

1. Connect your GitHub repository (`https://github.com/rahu-ul/TravelOS`) to [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client` (or root if using monorepo configuration)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL` = `https://travelos-backend-ksib.onrender.com`
4. Deploy. Vercel automatically applies rewrite rules from `client/vercel.json` or `vercel.json` to handle client-side SPA routing.

---

## 7. Render Backend Deployment

1. Log in to [Render](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repository (`https://github.com/rahu-ul/TravelOS`).
3. Configure service settings:
   - **Runtime:** Node
   - **Region:** Singapore or Frankfurt (closest to target users)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/bootstrap.js ./index.js`
4. Under **Environment Variables**, configure:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `YOUR_MONGODB_URI`
   - `MONGODB_DB_NAME` = `travelos`
   - `JWT_SECRET` = `YOUR_JWT_SECRET`
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_ORIGINS` = `https://travel-os-indol.vercel.app,http://localhost:5173`
   - `SEED_ADMIN_EMAIL` = `YOUR_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD` = `YOUR_ADMIN_PASSWORD`

---

## 8. CORS Configuration

CORS is managed dynamically in `server/src/app.js`:
- Allowed origins include all entries defined in `CLIENT_ORIGINS`.
- In production, requests from `https://travel-os-indol.vercel.app` and any branch preview URL matching `https://travel-os-*.vercel.app` are automatically permitted.
- `credentials: true` is enabled to allow cookie transmission.

---

## 9. Production API Configuration

The Axios client in `client/src/api/client.js` normalizes API access:
```javascript
const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
const baseURL = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`) : '/api';
```
This ensures that whether `VITE_API_URL` is set with or without the `/api` suffix, the frontend always routes calls to valid endpoints.

---

## 10. Authentication and Cookie Configuration

To support deployment across separate domains (`vercel.app` and `onrender.com`), the application uses a **Dual-Authentication Architecture**:
1. **Cookie Configuration:**
   - In production (`NODE_ENV=production`), cookies are issued with:
     ```javascript
     {
       httpOnly: true,
       secure: true,
       sameSite: 'none',
       maxAge: 7 * 24 * 60 * 60 * 1000
     }
     ```
2. **Bearer Token Fallback:**
   - Because privacy features like Safari ITP or Chrome third-party cookie restrictions frequently drop cross-site cookies, the server also returns the JWT token in the response payload.
   - The frontend stores the token in `localStorage` (`travelos_token`).
   - The Axios request interceptor attaches `Authorization: Bearer <token>` to all outgoing requests.
   - Backend middleware (`server/src/middleware/authenticate.js`) verifies either `req.cookies.travelos_jwt` or `req.headers.authorization`.

---

## 11. Redeployment Procedure

### Redeploying Backend Changes
1. Push your commit to the `main` branch on GitHub:
   ```bash
   git push origin main
   ```
2. Render detects the push and automatically runs `npm install` and restarts the service.
3. Monitor the deploy logs on Render. Once the build completes, verify the health endpoint:
   ```bash
   curl https://travelos-backend-ksib.onrender.com/api/health
   ```

### Redeploying Frontend Changes
1. Pushing to GitHub triggers an automatic Vercel build.
2. Vercel runs `npm run build` and deploys static assets to its global CDN edge within 60 seconds.

---

## 12. Common Deployment Errors and Troubleshooting

### A. Render Connecting to `test` Database
- **Symptom:** Render log displays `MongoDB connected (test)`.
- **Cause:** MongoDB Atlas connection string did not specify a database slug in the path.
- **Fix:** Code in `server/src/config/db.js` now explicitly sets `connectOptions.dbName = process.env.MONGODB_DB_NAME || 'travelos'`. Ensure `MONGODB_DB_NAME=travelos` is defined in your Render Environment settings.

### B. Render Running in `development` Mode
- **Symptom:** Render log displays `port 5000 (development)`.
- **Cause:** Render does not automatically set `NODE_ENV=production`.
- **Fix:** Add `NODE_ENV=production` to the Render Dashboard under **Environment**.

### C. 404 Error on Direct Page Refresh (Vercel)
- **Symptom:** Navigating to `/packages` or `/admin` directly in the browser address bar returns a Vercel 404.
- **Cause:** Vercel looks for a static file matching that path instead of delegating to `index.html`.
- **Fix:** Both `vercel.json` (root) and `client/vercel.json` contain rewrite rules:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### D. CORS Preflight Failures (`403 Forbidden` / Blocked Request)
- **Symptom:** Browser console logs `Access-Control-Allow-Origin header is missing`.
- **Cause:** Frontend domain is not included in `CLIENT_ORIGINS`.
- **Fix:** Add `https://travel-os-indol.vercel.app` to `CLIENT_ORIGINS` in Render and redeploy.

### E. Session Dropped on Page Refresh (Safari / Chrome Cross-Domain)
- **Symptom:** User logs in, but refreshing the page logs them out.
- **Cause:** Browser blocks third-party cookie between `vercel.app` and `onrender.com`.
- **Fix:** Resolved by the Dual-Auth system; verify that `localStorage.getItem('travelos_token')` contains the token and that outgoing requests carry the `Authorization: Bearer` header.

---

## 13. Production Verification Checklist

Before final assessment submission:
- [ ] Render `/api/health` returns `{"success": true, "data": {"status": "ok", "db": "connected"}}`.
- [ ] Render logs show connection to `travelos` database and `production` mode.
- [ ] Vercel homepage loads cleanly without console errors.
- [ ] Direct refresh on `/packages` loads without a 404.
- [ ] Direct refresh on `/packages/munnar-thekkady-alleppey-houseboat` displays full details.
- [ ] Direct hit on `/ssr/packages/munnar-thekkady-alleppey-houseboat` returns full pre-rendered HTML.
- [ ] Direct hit on `/robots.txt` and `/sitemap.xml` return valid SEO responses.
- [ ] Testing a legacy URL (e.g. `https://travelos-backend-ksib.onrender.com/kerala-houseboats`) issues a `301 Moved Permanently` redirect to `/packages/munnar-thekkady-alleppey-houseboat`.
- [ ] Contact form submission succeeds and displays a real reference code (`ENQ-...`).
- [ ] Admin login functions and session persists across page refreshes.
- [ ] Branded quote generator produces formatted output and triggers the print dialog cleanly.
- [ ] No private `.env` files or credentials are tracked in Git.

