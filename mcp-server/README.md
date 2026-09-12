# CRM MCP server

Exposes eight read-only CRM tools at `/mcp` on the configured host and port.
All tools share backend authentication, validate responses, and return structured data.

```text
src/
  tools/
    company.tools.ts
    contact.tools.ts
    lead.tools.ts
    pipeline.tools.ts
  services/
    company.service.ts
    contact.service.ts
    lead.service.ts
    pipeline.service.ts
    read.service.ts
  clients/
    crm.client.ts
  schemas/
    company.schema.ts
    contact.schema.ts
    lead.schema.ts
    pipeline.schema.ts
  middleware/
    auth.ts
    error-handler.ts
  utilities/
    tool-result.ts
  config.ts
  server.ts
  index.ts
```

Tools define the MCP interface and call services. Services handle retrieval and
validate responses with schemas. The CRM client handles HTTP requests, using
`middleware/auth.ts` for a process-wide backend login and refresh session.
`server.ts` assembles the MCP server and Express app; `index.ts` loads the
environment and starts the listener.

| Tool | Arguments | Structured result |
| --- | --- | --- |
| `get_all_companies` | `{}` | `{ companies, total }` |
| `get_all_contacts` | `{}` | `{ contacts, total }` |
| `get_all_leads` | `{}` | `{ leads, total }` |
| `get_company` | `{ "id": "<company UUID>" }` | `{ company }` |
| `get_contact` | `{ "id": "<contact UUID>" }` | `{ contact }` |
| `get_lead` | `{ "id": "<lead UUID>" }` | `{ lead }` |
| `get_pipelines` | `{}` | `{ pipelines, total }` |
| `get_pipeline_stages` | `{ "pipelineId": "<pipeline UUID>" }` | `{ stages, total }` |

Contacts include their company association (or null). Leads include company,
contact, owner, stage, priority, and source. Lead values remain decimal strings
as returned by the backend, preserving monetary precision. Pipelines include
stages; `get_pipeline_stages` returns stages in the backend's configured order.

The three `get_all_*` tools fetch pages of 100 records with a shared 30-second
deadline. They reject incomplete lists, duplicate IDs, changed pagination totals,
and invalid responses instead of returning partial success. Pipeline collections
are unpaginated. Detail tools require a valid UUID and verify the returned ID.
Missing records and backend failures use MCP's `isError` result via the shared
error wrapper. Successful results appear in both `structuredContent` and JSON
text content. These tools do not create or modify CRM records.

From `mcp-server/`, install dependencies with `npm install`, copy `.env.example`
to `.env`, and set `BACKEND_EMAIL` and `BACKEND_PASSWORD` to backend account credentials.
Set `BACKEND_BASE_URL` to your backend's origin; it is required when calling the tool.

```bash
npm run dev
```

For a compiled build, run `npm run build` followed by `npm start`.
Run `npm test` to build and execute authentication and CRM tool tests.

Configuration is read from environment variables. `.env` is a local convenience;
deployment variables already present in the process take precedence over `.env`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `HOST` | Network interface to listen on | `127.0.0.1` |
| `PORT` | Listener port, from 1 to 65535 | `4001` |
| `BACKEND_BASE_URL` | CRM backend origin, including HTTP or HTTPS | Required for tool calls |
| `BACKEND_EMAIL` | Backend account email | Required for tool calls |
| `BACKEND_PASSWORD` | Backend account password; use deployment secrets | Required for tool calls |
| `MCP_ALLOWED_HOSTS` | Comma-separated hostnames accepted in the Host header | SDK defaults for `HOST` |
| `MCP_ALLOWED_ORIGINS` | Comma-separated hostnames accepted in the Origin header | SDK defaults for `HOST` |

For a container deployment, set `HOST=0.0.0.0`, use the platform's `PORT`, and
set `BACKEND_BASE_URL` to the reachable backend origin. Set `MCP_ALLOWED_HOSTS`
to the MCP domain and `MCP_ALLOWED_ORIGINS` to permitted client origin hostnames.
Both lists use hostnames only, without schemes, ports, or paths. The SDK enables
localhost host/origin validation by default for localhost binds; other binds need
explicit lists to enable that validation.

The configured backend account authenticates outgoing CRM calls. Incoming MCP authentication and
public HTTPS must be configured as part of deployment; hostname lists do not
authenticate callers.

## Session lifecycle

The first tool call logs in. All tool calls in this process share one authentication
manager, which holds access tokens and the latest refresh cookie only in memory.
Expired access tokens trigger one shared refresh and one retry of the CRM request.
An expired or rejected refresh session permits one new credential login. Backend
outages and `403` responses do not trigger repeated login attempts. Tool discovery
never logs in or requires backend credentials.

A restart loses the in-memory session and the next call logs in again. A process
can continue beyond the backend's seven-day session limit by logging in again with
its configured credentials. Use an account whose existing permissions match the
intended MCP access; this change does not introduce new roles or incoming MCP auth.

For the current HTTP deployment, the backend must explicitly set
`AUTH_ALLOW_INSECURE_HTTP=true`. The MCP client rejects Secure refresh cookies over
HTTP. When HTTPS is available, set the backend flag to `false` and use an HTTPS
`BACKEND_BASE_URL`. Never paste tokens or passwords into tool messages or logs.

See [authentication deployment](../docs/authentication.md) for backend migration,
Nginx proxy configuration, session behavior, and the complete validation commands.

## Calling a tool

For this server's HTTP endpoint, send a JSON-RPC tool call:

```bash
curl -N http://127.0.0.1:4001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_all_contacts","arguments":{}}}'
```

Use `get_pipelines` to discover pipeline IDs, then call `get_pipeline_stages`
with `arguments: {"pipelineId":"<returned ID>"}`. Similarly, use a list tool's
record IDs for `get_company`, `get_contact`, and `get_lead`. MCP clients can discover
all input/output schemas using `tools/list`. Restart a compiled MCP process after
building changes; development watch mode reloads source changes automatically.
