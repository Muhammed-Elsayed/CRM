# Back-End Understanding Report

This report explains the `back-end/` folder as it exists now. It is written as a practical reading guide: what the backend does, where requests enter, how data moves through the layers, how the database is shaped, and which parts are active versus leftover scaffolding.

## 1. Executive Summary

The backend is a monolithic Node.js + TypeScript API for a CRM-style sales pipeline app named ClientFlow CRM.

Core responsibilities:

- Authenticate users with email/password and JWT bearer tokens.
- Manage companies, contacts, leads, pipelines, and pipeline stages.
- Serve an OpenAPI JSON document.
- Connect to PostgreSQL through Prisma.
- Seed a default sales pipeline.
- Create an admin user from environment variables.

Main stack:

- Runtime: Node.js with ES modules.
- HTTP framework: Express 5.
- Language: TypeScript.
- Database ORM: Prisma 7 with PostgreSQL and `@prisma/adapter-pg`.
- Validation: Zod for the active API.
- Authentication: JWT + bcrypt.
- Security middleware: Helmet, CORS, rate limiting.

The code follows this layered flow:

```text
server.ts
  -> app.ts
    -> routes
      -> controllers
        -> schemas / parseZodSchema
        -> services
          -> Prisma client
            -> PostgreSQL
```

Most feature behavior lives in `src/services/`. Controllers stay thin and mostly validate input, call a service, and format the response.

## 2. Quick Reading Path

If you want to understand the backend quickly, read these files in this order:

1. `back-end/package.json`
   - Shows dependencies and commands.

2. `back-end/src/server.ts`
   - Shows startup, DB connection, HTTP listener, and shutdown behavior.

3. `back-end/src/app.ts`
   - Shows global middleware, health endpoints, rate limits, CORS, and route registration.

4. `back-end/src/routes/index.ts`
   - Shows the top-level API modules under `/api`.

5. `back-end/src/routes/*.ts`
   - Shows every endpoint and which routes require authentication.

6. `back-end/src/controllers/*.ts`
   - Shows request parsing, validation, service calls, and response messages.

7. `back-end/src/services/*.ts`
   - Shows the actual business rules and Prisma queries.

8. `back-end/prisma/schema.prisma`
   - Shows the database tables, relations, enums, indexes, and delete behavior.

9. `back-end/src/schemas/*.ts`
   - Shows exactly what request bodies, params, and query strings are accepted.

10. `back-end/src/models/*.ts`
    - Shows the Prisma `select` shapes returned by the API.

## 3. Project Layout

```text
back-end/
  package.json
  tsconfig.json
  prisma.config.ts
  .env.example
  .env.production.example
  prisma/
    schema.prisma
    seed.ts
    migrations/
  src/
    app.ts
    server.ts
    config/
    controllers/
    db/
    docs/
    middlewares/
    models/
    routes/
    schemas/
    scripts/
    services/
    utilities/
  dist/
  node_modules/
```

Important notes:

- `src/` is the source of truth.
- `dist/` is generated JavaScript from `npm run build`.
- `node_modules/` is installed dependencies.
- `Good_structure.md` is a general architecture guide, not runtime code.
- Some deployment files appear deleted in the current git worktree, so this report focuses on the available source.

## 4. Package Scripts

From `back-end/package.json`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Runs `tsx watch src/server.ts` for development. |
| `npm run build` | Compiles TypeScript into `dist/`. |
| `npm start` | Runs `node dist/server.js`. |
| `npm run typecheck` | Runs `tsc --noEmit`. |
| `npm run check` | Builds and validates the Prisma schema. |
| `npm run prisma:generate` | Generates Prisma client. |
| `npm run prisma:migrate` | Runs Prisma dev migrations. |
| `npm run prisma:migrate:deploy` | Applies migrations in deploy/prod style. |
| `npm run prisma:seed` | Runs Prisma seed command. |
| `npm run db:seed` | Runs the compiled default pipeline seed script. |
| `npm run db:deploy` | Applies migrations, then seeds the default pipeline. |
| `npm run admin:create` | Runs the compiled admin creation script. |

Verification performed while writing this report:

```bash
npm run typecheck
npm run check
```

Both passed. `npm run check` ran a TypeScript build and `prisma validate`.

## 5. Runtime Entry Points

### `src/server.ts`

This is the real process entry point.

It does four things:

1. Calls `connectDatabase()`.
2. Starts the Express app on `config.port`.
3. Registers graceful shutdown handlers for `SIGTERM` and `SIGINT`.
4. Disconnects Prisma before process exit.

If startup fails, it logs the error and exits with code `1`.

### `src/app.ts`

This builds the Express app.

Global setup:

- Disables `x-powered-by`.
- Sets `trust proxy` from config.
- Enables Helmet.
- Enables CORS with credentials.
- Parses JSON bodies up to `1mb`.
- Parses cookies.
- Applies API rate limiting.
- Applies stricter login rate limiting.
- Registers health and readiness checks.
- Mounts all app routes under `/api`.
- Registers 404 and error handlers.

Health endpoints:

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | Public | Returns `{ ok: true }` if the app process is alive. |
| `GET /api/ready` | Public | Runs `SELECT 1` through Prisma and returns 503 if DB is unavailable. |

Rate limits:

- All `/api` requests: 1000 requests per 15 minutes.
- `/api/auth/login`: 10 requests per 15 minutes.

## 6. Configuration

Config lives in `src/config/index.ts`.

The app loads environment files in this order:

1. `.env.${NODE_ENV}`
2. `.env`

Then it validates environment variables with Zod.

Expected variables:

| Variable | Meaning |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`. Defaults to `development`. |
| `PORT` | HTTP port. Defaults to `4000`. |
| `CORS_ORIGINS` | Comma-separated allowed origins, or `*`. |
| `CORS_ORIGIN` | Single allowed origin, older/singular alternative. |
| `DATABASE_URL` | PostgreSQL connection URL. Required. |
| `JWT_SECRET` | JWT signing secret. Required, minimum 32 chars. |
| `TRUST_PROXY` | Express trust proxy value. |
| `LOG_LEVEL` | Validated but not actively used by a logger yet. |

Production guardrails:

- `JWT_SECRET` must be at least 32 characters.
- In production, placeholder-looking JWT secrets are rejected.
- Default `trustProxy` becomes `1` in production.

CORS behavior:

- Requests without an `Origin` header are allowed.
- Origins listed in config are allowed.
- `*` means all origins are allowed.
- Other browser origins are rejected by CORS.

## 7. Database and Prisma

Database setup lives in `src/db/config.ts`.

The backend uses:

- `PrismaClient`
- `PrismaPg` adapter
- PostgreSQL connection string from `config.databaseUrl`

Exports:

| Export | Purpose |
| --- | --- |
| `prisma` | Shared Prisma client instance. |
| `connectDatabase()` | Calls `prisma.$connect()`. |
| `disconnectDatabase()` | Calls `prisma.$disconnect()`. |
| `checkDatabaseConnection()` | Executes `SELECT 1`. Used by `/api/ready`. |

The Prisma schema is in `prisma/schema.prisma`.

Migration SQL exists at:

```text
back-end/prisma/migrations/20260803000000_initial/migration.sql
```

## 8. Database Model

### Enums

`PipelineStageType`

- `OPEN`
- `WON`
- `LOST`

`LeadSource`

- `WEBSITE`
- `REFERRAL`
- `EMAIL`
- `CALL`
- `SOCIAL_MEDIA`
- `AFFILIATE`
- `OTHER`

`LeadPriority`

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### Tables

#### `users`

Prisma model: `User`

Fields:

- `id`
- `name`
- `email`
- `passwordHash`
- `createdAt`

Constraints:

- `email` is unique.

Used for:

- Login.
- Lead ownership checks.
- Attaching owner details to leads.

Important detail:

- `Lead.ownerId` is checked manually against `users.id` in services, but the Prisma schema does not define a foreign-key relation from `Lead` to `User`.

#### `companies`

Prisma model: `Company`

Fields:

- `id`
- `name`
- `website`
- `industry`
- `size`
- `country`
- `city`
- `createdAt`
- `updatedAt`

Relations:

- Has many contacts.
- Has many leads.

Indexes:

- `name`

Delete behavior:

- If a company is deleted, related contacts and leads keep existing but their `companyId` is set to `null`.

#### `contacts`

Prisma model: `Contact`

Fields:

- `id`
- `companyId`
- `firstName`
- `lastName`
- `email`
- `phone`
- `jobTitle`
- `createdAt`
- `updatedAt`

Relations:

- Optionally belongs to a company.
- Has many leads.

Indexes:

- `companyId`
- `email`

Delete behavior:

- If a contact is deleted, related leads keep existing but their `contactId` is set to `null`.

#### `pipelines`

Prisma model: `Pipeline`

Fields:

- `id`
- `name`
- `createdAt`
- `updatedAt`

Relations:

- Has many pipeline stages.

Constraints:

- `name` is unique.

#### `pipeline_stages`

Prisma model: `PipelineStage`

Fields:

- `id`
- `pipelineId`
- `name`
- `order`
- `type`
- `createdAt`
- `updatedAt`

Relations:

- Belongs to a pipeline.
- Has many leads.

Constraints:

- `pipelineId + name` is unique.
- `pipelineId + order` is unique.

Delete behavior:

- If a pipeline is deleted, its stages are deleted.
- If a stage has leads, stage deletion is restricted by the `Lead.stage` relation.

#### `leads`

Prisma model: `Lead`

Fields:

- `id`
- `title`
- `description`
- `companyId`
- `contactId`
- `ownerId`
- `stageId`
- `value`
- `source`
- `priority`
- `expectedCloseDate`
- `closedAt`
- `createdAt`
- `updatedAt`

Relations:

- Optionally belongs to a company.
- Optionally belongs to a contact.
- Belongs to a pipeline stage.
- Has an `ownerId` that should match a user, enforced by service code rather than DB relation.

Indexes:

- `companyId`
- `contactId`
- `ownerId`
- `stageId`
- `priority`

Business requirement:

- A lead must be connected to a company, a contact, or both.

## 9. API Routing Overview

Top-level routes are registered in `src/routes/index.ts`.

Everything below is mounted under `/api`.

| Module | Base Path | File |
| --- | --- | --- |
| Auth | `/api/auth` | `src/routes/auth-routes.ts` |
| Docs | `/api/docs` | `src/routes/docs-routes.ts` |
| Companies | `/api/companies` | `src/routes/company-routes.ts` |
| Contacts | `/api/contacts` | `src/routes/contact-routes.ts` |
| Leads | `/api/leads` | `src/routes/lead-routes.ts` |
| Pipelines | `/api/pipelines` | `src/routes/pipeline-routes.ts` |

### Public Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Process health check. |
| `GET` | `/api/ready` | Database readiness check. |
| `POST` | `/api/auth/login` | Login and return JWT token. |
| `GET` | `/api/docs/openapi.json` | Return OpenAPI document. |

### Protected Endpoints

These require:

```http
Authorization: Bearer <token>
```

Companies:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/companies` | List companies. |
| `POST` | `/api/companies` | Create company. |
| `GET` | `/api/companies/:id` | Get company by id. |
| `PATCH` | `/api/companies/:id` | Update company. |
| `DELETE` | `/api/companies/:id` | Delete company. |

Contacts:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/contacts` | List contacts. |
| `POST` | `/api/contacts` | Create contact. |
| `GET` | `/api/contacts/:id` | Get contact by id. |
| `PATCH` | `/api/contacts/:id` | Update contact. |
| `DELETE` | `/api/contacts/:id` | Delete contact. |

Leads:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/leads` | List leads. |
| `POST` | `/api/leads` | Create lead. |
| `GET` | `/api/leads/:id` | Get lead by id. |
| `PATCH` | `/api/leads/:id` | Update lead. |
| `PATCH` | `/api/leads/:id/stage` | Move lead to another stage. |
| `DELETE` | `/api/leads/:id` | Delete lead. |

Pipelines:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/pipelines` | List pipelines. |
| `GET` | `/api/pipelines/default` | Get the default sales pipeline. |
| `GET` | `/api/pipelines/board` | Get stages with leads grouped as a board. |
| `GET` | `/api/pipelines/:pipelineId/stages` | List stages for one pipeline. |

## 10. Authentication

Authentication is implemented across:

- `src/routes/auth-routes.ts`
- `src/controllers/auth-controller.ts`
- `src/services/auth-service.ts`
- `src/middlewares/token.ts`
- `src/utilities/hash-password.ts`

### Login Flow

Endpoint:

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Flow:

1. Controller validates the body with `AuthSchemas.login`.
2. Service finds the user by email.
3. Service verifies the password with bcrypt.
4. Service signs a JWT containing:
   - `userId`
   - `email`
5. API returns public user data and the token.

JWT details:

- Signed with `config.jwtSecret`.
- Expires in `1h`.
- Used through the `Authorization` header.

The backend has `cookie-parser`, but authentication currently uses bearer tokens, not cookies.

### Protected Route Flow

Protected route modules call:

```ts
this.router.use(verifyToken)
```

`verifyToken`:

1. Reads `req.headers.authorization`.
2. Requires the `Bearer <token>` format.
3. Verifies JWT signature and expiry.
4. Looks up the user by decoded `userId`.
5. Stores the authenticated user in `res.locals.authUser`.
6. Calls `next()`.

If the token is missing, malformed, invalid, expired, or belongs to a deleted user, the request fails before reaching the controller.

## 11. Validation

Active request validation uses Zod.

Important files:

- `src/schemas/auth-schema.ts`
- `src/schemas/sales-pipeline-schema.ts`
- `src/utilities/parse-zod-schema.ts`

The common controller pattern is:

```ts
const query = parseZodSchema(SalesPipelineSchemas.companyListQuery, req.query)
```

If validation fails:

- Zod issues are joined into one message.
- A `WebError.BadRequest` is thrown.
- The error handler returns a JSON error response.

Common query defaults:

- `page`: defaults to `1`.
- `limit`: defaults to `20`.
- `limit` maximum is `100`.
- Empty strings are often treated as `undefined`.

Lead validation:

- `source` must be one of the `LeadSource` enum values.
- `priority` must be one of the `LeadPriority` enum values.
- `value` must be non-negative.
- `stageId` is required when creating a lead.
- A lead create request must include `companyId` or `contactId`.

## 12. Response and Error Format

Success responses use `responseHandler` from `src/utilities/api-response.ts`.

Shape:

```json
{
  "statusCode": 200,
  "message": "Example message",
  "data": {},
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

The `data` property contains the controller result. If the provided context is falsy, `data` becomes `{}`.

Error responses use `errorHandler` from `src/middlewares/error-handler.ts`.

Shape:

```json
{
  "statusCode": 404,
  "statusText": "Not Found",
  "message": "The resource you are looking for was not found."
}
```

`WebError` provides helpers for:

- `NotFound`
- `UnprocessableEntity`
- `UnAuthorized`
- `Forbidden`
- `BadRequest`
- `InternalServerError`

Important behavior:

- In production, 500-level messages are masked as `Internal Server Error`.
- `asyncWrapper` converts non-`WebError` exceptions into a generic 500 before passing them to the error handler.

## 13. Feature-by-Feature Behavior

### Auth

Files:

- `src/routes/auth-routes.ts`
- `src/controllers/auth-controller.ts`
- `src/services/auth-service.ts`
- `src/schemas/auth-schema.ts`

Supported operation:

- Login only.

There is no public signup route. Users are expected to exist already, usually through the admin creation script or direct database seeding.

### Companies

Files:

- `src/routes/company-routes.ts`
- `src/controllers/company-controller.ts`
- `src/services/company-service.ts`
- `src/models/company-model.ts`

Operations:

- List
- Get by id
- Create
- Update
- Delete

List behavior:

- Supports pagination.
- Supports search across:
  - `name`
  - `website`
  - `industry`
  - `country`
  - `city`
- Orders by `createdAt desc`.
- Returns `{ items, meta }`.

Create/update behavior:

- `name` is required on create.
- Optional fields can be updated.
- Some update fields can be set to `null`.

Delete behavior:

- Deletes the company row.
- Related contacts/leads are preserved with `companyId = null` because of Prisma relation behavior.

### Contacts

Files:

- `src/routes/contact-routes.ts`
- `src/controllers/contact-controller.ts`
- `src/services/contact-service.ts`
- `src/models/contact-model.ts`

Operations:

- List
- Get by id
- Create
- Update
- Delete

List behavior:

- Supports pagination.
- Can filter by `companyId`.
- Supports search across:
  - `firstName`
  - `lastName`
  - `email`
  - `phone`
  - `jobTitle`
- Orders by `createdAt desc`.

Create/update behavior:

- `firstName` and `lastName` are required on create.
- If `companyId` is supplied, the service checks that the company exists.
- `companyId` can be set to `null` on update.

Delete behavior:

- Deletes the contact row.
- Related leads are preserved with `contactId = null`.

### Leads

Files:

- `src/routes/lead-routes.ts`
- `src/controllers/lead-controller.ts`
- `src/services/lead-service.ts`
- `src/models/lead-model.ts`

Operations:

- List
- Get by id
- Create
- Update
- Move stage
- Delete

List behavior:

- Supports pagination.
- Supports filters:
  - `companyId`
  - `contactId`
  - `stageId`
  - `ownerId`
  - `priority`
  - `source`
- Supports search across:
  - lead title
  - lead description
  - company name
  - contact first name
  - contact last name
  - contact email
- Orders by `updatedAt desc`.
- Attaches owner public user data after fetching leads.

Create behavior:

- Requires `title`.
- Requires `stageId`.
- Requires at least one of `companyId` or `contactId`.
- Validates that referenced company/contact exists.
- If `ownerId` is omitted, owner defaults to the authenticated user.
- Validates that owner exists.
- Validates that pipeline stage exists.
- If the target stage type is `WON` or `LOST`, sets `closedAt` to now.

Update behavior:

- Verifies the lead exists.
- Calculates final `companyId` and `contactId`.
- Ensures the lead still has at least one association after update.
- Validates new company/contact/owner/stage references when present.
- If moving into a `WON` or `LOST` stage and the lead was not already closed, sets `closedAt` to now.
- If `closedAt` is explicitly provided, that value wins.

Move-stage behavior:

- Endpoint: `PATCH /api/leads/:id/stage`.
- Validates the lead exists.
- Validates the target stage exists.
- Updates only `stageId` and maybe `closedAt`.
- If the new stage type is `WON` or `LOST` and the lead is not already closed, sets `closedAt` to now.

Important nuance:

- Moving a closed lead back to an `OPEN` stage does not automatically clear `closedAt`. Clearing it requires an update request that explicitly sets `closedAt` to `null`.

Delete behavior:

- Fetches the lead first.
- Deletes it.
- Attaches owner public user data to the deleted lead response.

### Pipelines

Files:

- `src/routes/pipeline-routes.ts`
- `src/controllers/pipeline-controller.ts`
- `src/services/pipeline-service.ts`
- `src/models/pipeline-model.ts`

Operations:

- List pipelines.
- Get default pipeline.
- List stages for a pipeline.
- Get board view.

Default pipeline name:

```text
Default Sales Pipeline
```

Default stages:

| Order | Name | Type |
| --- | --- | --- |
| 1 | New | `OPEN` |
| 2 | Follow Up | `OPEN` |
| 3 | Prospect | `OPEN` |
| 4 | Negotiation | `OPEN` |
| 5 | Won | `WON` |
| 6 | Lost | `LOST` |

List behavior:

- `GET /api/pipelines`
- Query: `includeStages`
- Defaults to including stages.
- Orders pipelines by `createdAt asc`.

Board behavior:

- `GET /api/pipelines/board`
- If `pipelineId` is supplied, returns that pipeline board.
- If omitted, returns the default pipeline board.
- Returns pipeline metadata and stages.
- Each stage includes leads ordered by:
  - `updatedAt desc`
  - `createdAt desc`
- Owner public user data is attached to every board lead.

## 14. Prisma Select Models

The files in `src/models/` are not class-style domain models. They are reusable Prisma `select` objects and TypeScript payload types.

Purpose:

- Keep API response shape consistent.
- Avoid returning sensitive fields like `passwordHash`.
- Avoid repeating large `select` objects in every service.

Important selects:

| File | Select | Purpose |
| --- | --- | --- |
| `user-model.ts` | `publicUserSelect` | Returns user without `passwordHash`. |
| `company-model.ts` | `companySelect` | Public company shape. |
| `contact-model.ts` | `contactSelect` | Contact plus nested company. |
| `lead-model.ts` | `leadSelect` | Lead plus company, contact, and stage. |
| `lead-model.ts` | `leadBoardSelect` | Lead board shape without nested stage. |
| `pipeline-model.ts` | `pipelineWithStagesSelect` | Pipeline with sorted stages. |
| `pipeline-model.ts` | `pipelineStageBoardSelect` | Stage with sorted leads. |

Owner data is not included directly by `leadSelect` because there is no Prisma relation from `Lead` to `User`. Services attach owners with separate user queries.

## 15. OpenAPI Documentation

OpenAPI source:

```text
back-end/src/docs/openapi.ts
```

Served at:

```http
GET /api/docs/openapi.json
```

The document describes the main API schemas and routes. It is useful for consumers, but it is manually maintained.

Known doc drift:

- The actual Express routes include `DELETE` endpoints for companies, contacts, and leads.
- The current OpenAPI document does not appear to document those delete endpoints.

## 16. Seed and Admin Scripts

### Prisma Seed

File:

```text
back-end/prisma/seed.ts
```

Purpose:

- Creates or updates the default sales pipeline.
- Ensures the six default stages exist with correct order and type.

It uses `upsert`, so rerunning it is safe for the default pipeline/stage names.

### Compiled Seed Script

Source:

```text
back-end/src/scripts/seed-default-pipeline.ts
```

Used by:

```bash
npm run db:seed
```

This script does the same default pipeline setup but runs from compiled `dist/`.

### Admin Creation

Source:

```text
back-end/src/scripts/create-admin.ts
```

Used by:

```bash
npm run admin:create
```

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `ADMIN_NAME` | Admin user name. |
| `ADMIN_EMAIL` | Admin user email. |
| `ADMIN_PASSWORD` | Admin password, minimum 12 characters. |
| `ADMIN_CREATE_IF_MISSING` | If true, existing admin email is treated as no-op. |

Behavior:

- Validates env vars with Zod.
- Checks whether a user with `ADMIN_EMAIL` exists.
- Hashes password with bcrypt.
- Creates the user.

## 17. Security Posture

Implemented:

- Helmet headers.
- CORS allowlist.
- Express `trust proxy` configuration.
- Login rate limiting.
- General API rate limiting.
- JWT expiry.
- bcrypt password hashing.
- Public user selects that exclude `passwordHash`.
- Production masking for 500 errors.

Things to watch:

- There is no role/permission system yet. Any authenticated user can access all protected CRM resources.
- `Lead.ownerId` is not a DB-level foreign key to `User`.
- The app has no automated tests in the backend source tree.
- `.env.production` should stay local and should not be committed.
- Cookie parsing is enabled but auth does not use cookies.

## 18. Active vs Legacy Code

Active core:

- `src/app.ts`
- `src/server.ts`
- `src/config/index.ts`
- `src/db/config.ts`
- `src/routes/*`
- `src/controllers/*`
- `src/services/*`
- `src/schemas/auth-schema.ts`
- `src/schemas/sales-pipeline-schema.ts`
- `src/models/*`
- `src/middlewares/token.ts`
- `src/middlewares/asyncWrapper.ts`
- `src/middlewares/error-handler.ts`
- `src/utilities/api-response.ts`
- `src/utilities/hash-password.ts`
- `src/utilities/parse-zod-schema.ts`
- `src/utilities/web-errors.ts`

Likely legacy or currently unused:

- `src/middlewares/validateRequests.ts`
  - Uses Joi-style validation.
  - The active API uses Zod instead.
  - It is excluded from TypeScript compilation.

- `src/utilities/emails.ts`
  - Uses `nodemailer`.
  - Imports old config values that are not exported by the current config module.
  - Excluded from TypeScript compilation.

- `src/utilities/encrypt-decrypt.ts`
  - Uses `crypto-js`.
  - Contains a hardcoded encryption key.
  - Excluded from TypeScript compilation.

- `src/utilities/upload-files.ts`
  - References Cloudinary config that is not present in the current config module.
  - Excluded from TypeScript compilation.

- `src/utilities/common-interfaces.ts`
  - Empty.

- `src/utilities/generate-passwords.ts`
  - Defines a random password generator.
  - Not currently referenced by active code.

The TypeScript config excludes several legacy utility files, which is why the active build succeeds even though those files reference missing dependencies or older config names.

## 19. Data Flow Examples

### Example: Login

```text
POST /api/auth/login
  -> auth-routes.ts
  -> AuthController.login
  -> AuthSchemas.login
  -> AuthService.login
  -> prisma.user.findUnique
  -> bcrypt.compare
  -> generateToken
  -> responseHandler
```

### Example: Create Lead

```text
POST /api/leads
  -> lead-routes.ts
  -> verifyToken
  -> LeadController.create
  -> SalesPipelineSchemas.leadCreate
  -> LeadService.create
  -> ensure company/contact exists
  -> ensure owner exists
  -> ensure stage exists
  -> maybe set closedAt
  -> prisma.lead.create
  -> attach owner
  -> responseHandler
```

### Example: Board View

```text
GET /api/pipelines/board
  -> pipeline-routes.ts
  -> verifyToken
  -> PipelineController.getBoard
  -> SalesPipelineSchemas.boardQuery
  -> PipelineService.getBoard
  -> find requested or default pipeline
  -> fetch stages with nested leads
  -> attach owners to leads
  -> responseHandler
```

## 20. How to Add a New Feature

The project is organized as a monolithic layered backend. To add a feature named `deals`, follow the existing pattern:

```text
src/models/deal-model.ts
src/schemas/deal-schema.ts
src/services/deal-service.ts
src/controllers/deal-controller.ts
src/routes/deal-routes.ts
```

Then register it in:

```text
src/routes/index.ts
```

Recommended responsibilities:

- Route: path, method, auth middleware.
- Controller: parse params/query/body, call service, return response.
- Schema: Zod validation.
- Service: business rules and Prisma calls.
- Model file: reusable Prisma selects and response types.

## 21. Current Gaps and Improvement Ideas

High-value improvements:

1. Add automated tests for auth, validation, and lead stage transitions.
2. Update OpenAPI docs to include actual delete endpoints.
3. Remove or repair legacy excluded files.
4. Add a Prisma relation or foreign key from `Lead.ownerId` to `User.id`.
5. Decide whether auth should use bearer tokens only or cookie-based sessions too.
6. Add role/permission checks if multiple user types are expected.
7. Improve `asyncWrapper` so unexpected errors can still be logged with original details while returning safe responses.
8. Consider centralizing pagination metadata to remove duplicated `buildMeta` helpers.
9. Add request/response examples to OpenAPI.
10. Add a README section for local DB setup, migrations, seed, and admin creation.

## 22. Mental Model to Keep

Think of this backend as a simple, layered CRM API:

```text
Express app
  receives HTTP request
  applies security/auth middleware
  routes to a controller
  validates with Zod
  delegates to a service
  reads/writes through Prisma
  formats a consistent JSON response
```

The most important folder for understanding behavior is `src/services/`. The most important file for understanding persisted data is `prisma/schema.prisma`. The most important file for understanding the public HTTP surface is `src/routes/index.ts`, then each `src/routes/*-routes.ts` file.
