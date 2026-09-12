# Frontend + Nginx Deployment Notes

This document summarizes the frontend and Nginx deployment discussion.

## Current Setup

The app is deployed on one EC2 instance.

- Backend runs in a Docker container named `api`.
- Backend listens on container/host port `4000`.
- Frontend is a Vite React app.
- Frontend build output is `front-end/dist`.
- Frontend is served by an Nginx Docker container.
- RDS is separate from EC2 and is used by the backend.

The public EC2 IP used during testing was:

```text
34.227.193.217
```

## Frontend API URL

The frontend reads its backend URL from:

```text
VITE_API_BASE_URL
```

The code is in:

```text
front-end/src/shared/api/httpClient.ts
```

The frontend API calls already include `/api`, for example:

```text
/api/auth/login
/api/companies
/api/contacts
/api/leads
/api/pipelines
```

So if the frontend calls the backend directly, the env value should be the backend origin only:

```env
VITE_API_BASE_URL=http://34.227.193.217:4000
```

Do not use:

```env
VITE_API_BASE_URL=http://34.227.193.217:4000/api
```

because that would risk creating URLs like:

```text
/api/api/companies
```

## Building Frontend On Amazon Linux

Amazon Linux installed Node 18 by default, but this frontend uses modern Vite packages that require Node 20/22.

The Node 18 build failed with:

```text
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+.
ReferenceError: CustomEvent is not defined
```

Instead of installing a newer Node version on EC2, Docker was used to build the frontend with Node 22:

```bash
cd ~/CRM/front-end

docker run --rm \
  -v "$PWD:/app" \
  -w /app \
  node:22-bookworm-slim \
  sh -c "npm ci && npm run build"
```

This created:

```text
front-end/dist
```

The production build succeeded.

## Confirming The API URL Was Baked In

Vite bakes env variables into the frontend build.

After changing `.env.production`, the frontend must be rebuilt.

The built JS was checked with:

```bash
grep -R "34.227.193.217" dist/assets | head
grep -R "YOUR_REAL_EC2_PUBLIC_IP" dist/assets | head
```

The built asset contained:

```text
http://34.227.193.217:4000
```

So the frontend build was pointing at the backend correctly.

## Serving Frontend With Nginx Container

The simple Nginx container command is:

```bash
cd ~/CRM/front-end

docker rm -f frontend

docker run -d --name frontend \
  -p 80:80 \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  nginx:alpine
```

This serves the Vite build on:

```text
http://34.227.193.217
```

Port `80` must be open in the EC2 security group:

```text
HTTP TCP 80 0.0.0.0/0
```

Initially only port `22` was allowed, so the site was not reachable from a local browser.

## React Router Refresh 404

After navigating inside the app, refreshing a route like this:

```text
http://34.227.193.217/contacts
```

showed:

```text
404 Not Found
nginx/1.31.3
```

The reason:

- React Router owns `/contacts` in the browser.
- `/contacts` is not a real file in `dist`.
- On refresh, the browser asks Nginx for `/contacts`.
- Default Nginx tries to find a real file/folder and returns 404.

The fix is to use a custom Nginx config with this fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

That tells Nginx:

```text
If the requested file does not exist, serve index.html and let React Router handle the route.
```

## Suggested Nginx Config For Current Direct-Backend Setup

If the frontend is built with:

```env
VITE_API_BASE_URL=http://34.227.193.217:4000
```

then Nginx only needs to serve frontend files and support React Router fallback:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Run Nginx with that config:

```bash
cd ~/CRM/front-end

docker rm -f frontend

docker run -d --name frontend \
  -p 80:80 \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine
```

Then test:

```bash
curl http://localhost
curl http://localhost/contacts
```

Both should return frontend HTML.

## Better Future Setup: Same-Origin API Proxy

The cleaner production setup is:

```text
Browser -> http(s)://domain
Nginx -> serves frontend
Nginx -> proxies /api to backend container on localhost:4000
```

With that setup:

- Frontend does not need to call `:4000` directly.
- Public port `4000` can be closed.
- Browser calls same-origin URLs like `/api/companies`.
- CORS becomes simpler.
- HTTPS avoids mixed-content problems.

For this setup, rebuild frontend with:

```env
VITE_API_BASE_URL=
```

Then rebuild:

```bash
cd ~/CRM/front-end

docker run --rm \
  -v "$PWD:/app" \
  -w /app \
  node:22-bookworm-slim \
  sh -c "npm ci && npm run build"
```

Nginx config would include:

```nginx
location /api/ {
    proxy_pass http://host.docker.internal:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

Run Nginx with:

```bash
docker run -d --name frontend \
  --add-host host.docker.internal:host-gateway \
  -p 80:80 \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine
```

## Backend CORS

If frontend calls backend directly on port `4000`, backend `.env.production` should include:

```env
CORS_ORIGINS=http://34.227.193.217
```

If using HTTPS/domain later:

```env
CORS_ORIGINS=https://your-domain.com
```

After changing backend env vars, recreate the backend container:

```bash
cd ~/CRM/back-end

docker rm -f api

docker run -d --name api \
  -p 4000:4000 \
  --env-file .env.production \
  api
```

## SSL With Certbot And Dockerized Nginx

The normal Certbot docs often suggest:

```bash
sudo certbot --nginx
```

That is not ideal here because Nginx is inside a Docker container.

`certbot --nginx` expects host-installed Nginx and tries to edit host config files such as:

```text
/etc/nginx/nginx.conf
/etc/nginx/conf.d/...
```

For this Docker setup, use Certbot webroot mode:

```text
Certbot container writes challenge/cert files.
Nginx container serves challenge files and reads cert files.
```

High-level SSL flow:

1. Use a real domain pointing to EC2.
2. Open EC2 inbound ports `80` and `443`.
3. Add a Certbot challenge location to `front-end/nginx.conf`.
4. Run Nginx container on port `80`.
5. Run Certbot container with `certonly --webroot`.
6. Edit `nginx.conf` manually to add the HTTPS `443 ssl` server block.
7. Recreate Nginx container with cert volume mounted.
8. Set backend `CORS_ORIGINS` to the HTTPS domain.

Example challenge location:

```nginx
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

Example Certbot command:

```bash
cd ~/CRM/front-end

mkdir -p certbot/www certbot/conf

docker run --rm \
  -v "$PWD/certbot/www:/var/www/certbot" \
  -v "$PWD/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

Then mount certs into Nginx:

```bash
docker run -d --name frontend \
  --add-host host.docker.internal:host-gateway \
  -p 80:80 \
  -p 443:443 \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$PWD/certbot/www:/var/www/certbot:ro" \
  -v "$PWD/certbot/conf:/etc/letsencrypt:ro" \
  nginx:alpine
```

## Current Status

Done:

- Backend Docker container works.
- Backend connects to RDS.
- Backend health and readiness checks pass.
- Backend CRUD endpoints were tested successfully.
- Frontend production build works using Dockerized Node 22.
- Frontend build has the backend URL baked in.
- Port `80` access issue was identified as EC2 security group related.
- React Router refresh 404 was identified as missing Nginx fallback.

Still to do:

- Mount/use a custom frontend `nginx.conf`.
- Add the React Router `try_files` fallback.
- Decide whether to keep direct `:4000` frontend API calls or switch to Nginx `/api` proxy.
- Add SSL using Certbot webroot if a real domain is available.
- Rebuild frontend with `VITE_API_BASE_URL=` if using same-origin `/api` proxy.
