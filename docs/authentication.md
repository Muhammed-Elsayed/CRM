# Authentication and deployment

Login returns the existing response envelope with `data.user` and `data.token`.
The token is a JWT signed with HS256, containing `sub`, `iat`, and `exp`. Its default
lifetime is 900 seconds. The server still checks that the user exists on protected
requests and supplies identity through `res.locals.authUser`.

Refresh tokens are 32 random bytes encoded as base64url. Only SHA-256 hashes are
stored in PostgreSQL. Each login has its own session and seven-day absolute expiry;
rotation does not extend that deadline. Consumed token hashes remain until session
expiry. All rotation and logout operations lock the parent session row. Replaying a
consumed token commits revocation of that session and returns 401. Other login
sessions are unaffected.

## HTTP interface

| Endpoint | Input | Success |
| --- | --- | --- |
| `POST /api/auth/login` | JSON `{ "email": "…", "password": "…" }` | `{ data: { user, token }, … }` and refresh cookie |
| `POST /api/auth/refresh` | Refresh cookie; optional empty JSON object | Same data shape and rotated cookie |
| `POST /api/auth/logout` | Refresh cookie if present | Success envelope and cleared cookie |

All three requests require `X-CRM-Auth: 1`. Browser `Origin` values must match
`CORS_ORIGINS` exactly. Native clients without Origin still require the header.
CORS uses explicit origins and credentials; `*` is rejected in configuration.
The browser uses credentialed Axios requests; MCP explicitly handles `Set-Cookie`
and sends the latest cookie on refresh. Raw refresh tokens never appear in JSON.

Cookies are host-only, HttpOnly, `SameSite=Lax`, and scoped to `/api/auth`. Secure is
enabled by default. Authentication responses have `Cache-Control: no-store`.
Missing, invalid, expired, or revoked refresh sessions return 401. Expired access
JWTs return 401 with `statusText: "AccessTokenExpired"`; clients only renew protected
requests for this specific failure. Database/server errors remain server errors.
The existing global API limiter applies, along with 10 login requests and 120 total
authentication requests per IP per 15 minutes. The in-memory limits are per backend
process; multi-replica deployments need a shared limiter store or gateway limits.

## Environment

| Variable | Default / requirement |
| --- | --- |
| `JWT_SECRET` | Required; at least 32 characters, random production secret |
| `AUTH_ACCESS_TOKEN_SECONDS` | `900`; integer from 1 to 3600 |
| `AUTH_SESSION_SECONDS` | `604800`; integer from 1 to 2592000 |
| `AUTH_ALLOW_INSECURE_HTTP` | `false`; only the literal `true` enables non-Secure cookies |
| `CORS_ORIGINS` | Explicit comma-separated browser origins including scheme and port |
| `BACKEND_BASE_URL` (MCP) | Backend origin, without `/api` |
| `BACKEND_EMAIL`, `BACKEND_PASSWORD` (MCP) | Backend account credentials; supply through deployment secrets |

For both local development and the current public HTTP server, explicitly set
`AUTH_ALLOW_INSECURE_HTTP=true` in the backend's selected environment. Set
`CORS_ORIGINS` to the actual browser origin (for example `http://YOUR_SERVER`, or
`http://localhost:5173` for Vite). HTTP permits interception of credentials and
tokens in transit. Once HTTPS is configured, set the flag to `false`, use HTTPS
origins in both clients, and sign in again.

## Same-origin Nginx proxy

Build the frontend with `VITE_API_BASE_URL=` so all browser calls use `/api` on the
frontend origin. Vite already proxies `/api` locally. For Nginx running on the same
host as the backend, merge these locations into the frontend server block:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache off;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

If Nginx runs in a container, use the backend's reachable container/service name
instead of `127.0.0.1`. Preserve the `/api/` path and pass cookies and `Set-Cookie`
unchanged. Configure `TRUST_PROXY` for the actual trusted proxy topology. Keep the
backend port private when all browser traffic goes through Nginx.

## Rollout

1. Supply the backend variables above and the MCP credentials. Remove the old
   MCP `BACKEND_TOKEN` setting. Do not change the signing secret merely for this rollout.
2. In `back-end`, run `npm ci`, `npm run prisma:generate`, and `npm run check`.
3. Apply the additive migration with `npm run prisma:migrate:deploy` against the
   intended deployment database, then restart the backend.
4. In `front-end`, run `npm ci` and build with an empty `VITE_API_BASE_URL`. Deploy
   the build and the `/api` proxy configuration together.
5. In `mcp-server`, run `npm ci`, `npm run build`, and restart with its credentials.
6. Sign in again in existing browsers. Legacy localStorage access tokens are removed;
   old JWTs without `sub` are intentionally rejected. Check login, page reload,
   refresh, and logout through the public frontend origin.
7. Schedule `npm run auth:cleanup` daily from the backend deployment directory,
   with its normal environment. It deletes expired sessions and cascading token
   history. Never remove consumed hashes from sessions that have not expired.

This repository change does not apply migrations or restart the live deployment.
The migration is additive; rollback to an earlier application version leaves the
new tables harmlessly present, but users must sign in again.

## Client behavior and limitations

The browser stores access tokens only in memory. IndexedDB holds a lease and session
generation metadata, never tokens or passwords. Cookie-mutating operations are
serialized across tabs with a renewable 20-second lease; auth requests time out
at 10 seconds and lease acquisition times out after 30 seconds. BroadcastChannel
announces login/logout boundaries. Logout clears React Query data and updates
other tabs only after backend confirmation. Session restoration errors offer retry;
a confirmed invalid session requires login.

Strict replay detection can require a new login if a rotation response is lost.
A tab suspended beyond its lease can also lose coordination; obsolete responses
are not accepted into application state. The browser itself applies Set-Cookie
before JavaScript processes a response, so network interruption or prolonged tab
suspension cannot be made perfectly atomic with browser storage. These cases may
require signing in again. Normal concurrent refreshes are serialized.

Logout stops refresh immediately. Existing access tokens remain usable until expiry
(up to 15 minutes). MCP uses its own login session and automatically logs in again
with its configured credentials after expiry or process restart. Browser logout
does not stop MCP. Incoming MCP authentication, password reset, new RBAC, and
logout-all-devices are outside this implementation.

## Validation

Use a **dedicated disposable PostgreSQL database whose name ends with `_test`**.
Never point these commands at a real CRM database. Backend tests apply migrations
and temporarily alter tables to exercise rollback and database failures. Run the
backend and browser suites sequentially if they share a test database.

```bash
# back-end/
TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/crm_auth_test npm test
npm run check

# front-end/
npm test
npm run lint
npm run build
npx playwright install chromium
TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/crm_auth_test npm run test:browser

# mcp-server/
npm test
```

Build the backend before browser tests. Playwright starts isolated backend and Vite
servers on ports 55440 and 5179, creates a test account, and checks actual HTTP cookie
round trips, reload restoration, cross-tab rotation/logout, expiry, outages, and
logout retry. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only when using an existing
compatible Chromium installation. Unit tests cover bounded retries and obsolete
responses; PostgreSQL tests cover concurrent rotation, replay, expiry, revocation,
rollback, cookie flags, JWT validation, and database-error propagation.
