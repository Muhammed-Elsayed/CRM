# ClientFlow CRM

A full-stack CRM for managing companies, contacts, leads, and a sales pipeline board.

## Stack

- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Auth:** JWT bearer tokens
- **Validation:** Zod

## Project Structure

```text
back-end/   Express API, Prisma schema, services, controllers, OpenAPI docs
front-end/  Vite React app, feature modules, shared UI and API client
```

## Prerequisites

- Node.js
- PostgreSQL
- npm

## Setup

Install dependencies:

```bash
cd back-end
npm install

cd ../front-end
npm install
```

Configure the backend:

```bash
cd back-end
cp .env.example .env
```

Update `back-end/.env` with your PostgreSQL connection string and JWT secret.

Run database migrations and seed the default sales pipeline:

```bash
cd back-end
npm run prisma:migrate
npm run prisma:seed
```

If the frontend should call a different API URL, create `front-end/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## Development

Start the API:

```bash
cd back-end
npm run dev
```

Start the frontend in another terminal:

```bash
cd front-end
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API health check: `http://localhost:4000/api/health`
- OpenAPI JSON: `http://localhost:4000/api/docs/openapi.json`

## Scripts

Backend:

- `npm run dev` - start the API in watch mode
- `npm run build` - compile TypeScript
- `npm run start` - run the compiled API
- `npm run prisma:migrate` - run Prisma migrations
- `npm run prisma:migrate:deploy` - apply production migrations
- `npm run prisma:seed` - seed default pipeline stages
- `npm run admin:create` - create the first production user from admin env vars

Frontend:

- `npm run dev` - start Vite
- `npm run build` - type-check and build
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build

## API Overview

All business routes are under `/api`:

- `POST /auth/login`
- `/companies`
- `/contacts`
- `/leads`
- `/pipelines`

Companies, contacts, leads, and pipelines require a bearer token.

For EC2/RDS Docker deployment, see `back-end/PRODUCTION.md`.
