# IRIS Admin Atlas

IRIS Admin Atlas is a safety-first management cockpit for InterSystems IRIS 2026.2. It turns the official SysAdmin REST surface into a searchable, privilege-aware operational interface with live read-only execution, request previews, operational snapshots, and browser-local history.

The goal is simple: make common administration discovery faster without hiding what endpoint is being called or which privilege it needs.

## Why it is useful

Instead of navigating a large API specification or remembering endpoint names, an operator can:

- search by task, endpoint, category, or required privilege
- inspect live process, web application, user, task, and audit state
- execute safe reads directly from the current authenticated IRIS browser session
- run explicitly read-only POST searches such as audit and journal queries
- preview mutating requests without sending them
- keep a lightweight local request history without persisting response bodies

The UI also includes a clearly labeled sample snapshot so the workflow is immediately understandable before a live IRIS session is connected.

## Quick start

### Docker Compose

```bash
docker compose up --build -d
```

Then open:

```text
http://localhost:52773/csp/admin-atlas/index.html
```

Sign in to IRIS if prompted and click **Connect to IRIS**.

To stop the environment:

```bash
docker compose down
```

### Docker directly

```bash
docker build -t iris-admin-atlas .
docker run --name iris-admin-atlas -p 52773:52773 -p 1972:1972 iris-admin-atlas
```

Open the same URL:

```text
http://localhost:52773/csp/admin-atlas/index.html
```

## What the interface shows

### Operational snapshot

The first screen summarizes the current IRIS instance:

- connection state
- running process count
- configured web applications
- security users
- scheduled tasks
- audit state

Below the metrics, compact live tables surface representative rows for processes, applications, tasks, and users. This gives the operator useful context before opening an individual API action.

### Action Atlas

The action catalog groups SysAdmin APIs into:

- Overview
- System
- Web apps
- Permissions
- Security
- Tasks
- Logs
- Storage

Every catalog entry shows the HTTP method, API path, purpose, privilege requirement, and risk class.

### Safe request runner

Entries marked `risk: "read"` can execute from the UI.

This includes:

- normal GET reads
- read-only POST search endpoints that do not mutate IRIS state

Write and destructive actions remain preview-only. The UI will not send them.

### Request preview

Any catalog entry can generate a cURL-style request preview. This is useful for understanding the exact endpoint and parameters before using another administrative workflow.

### Local history

Executed reads record only:

- timestamp
- HTTP method
- API path
- HTTP status
- elapsed time

Response bodies are not persisted. History stays in the current browser and can be exported as JSON.

## Preview mode vs live mode

The initial dashboard uses clearly labeled sample data so reviewers and operators can immediately understand the layout.

No sample value is presented as live.

Click **Connect to IRIS** to replace the preview snapshot with data read from the authenticated IRIS instance. If the connection cannot be established, the UI keeps the sample snapshot visible and reports the connection error separately.

## Safety model

IRIS Admin Atlas deliberately separates discovery from mutation.

The catalog uses three risk classes:

- `read` — safe operational reads; executable
- `write` — changes IRIS state; preview only
- `danger` — destructive or disruptive operations; preview only

The runner enforces this classification before issuing a request. A non-read catalog action cannot be executed from the UI.

Authentication is not reimplemented by the project. The page is served from the IRIS origin and uses the current authenticated browser session when calling `/api/admin` and `/api/admin/v2`.

## Manual install

Copy the files under `web/` into an IRIS CSP static directory named `admin-atlas` and expose it at:

```text
/csp/admin-atlas/
```

## Project layout

```text
.
├── Dockerfile
├── docker-compose.yml
├── Installer.cls
├── iris.script
├── module.xml
├── tests/
│   └── validate.mjs
└── web/
    ├── index.html
    ├── styles.css
    ├── catalog.js
    └── app.js
```

## Contest scope

IRIS Admin Atlas was built for the **InterSystems Programming Contest: Build Your Own Management Portal**.

It covers the contest's requested administration areas through the official SysAdmin API surface, including web apps, permissions, security, tasks, operating-system visibility, devices, audit data, and logs.

The endpoint catalog was curated from the official InterSystems SysAdmin API specification:

https://github.com/intersystems-community/sysadmin-api-specification

## Validation

The repository includes a catalog validation test that checks the expected administration categories and required endpoint metadata.

```bash
node tests/validate.mjs
```

## Design principles

1. **Useful before dangerous** — common operational reads are one click away.
2. **No hidden privilege model** — each action shows the privilege it expects.
3. **No disguised writes** — mutating actions stay visibly locked.
4. **No fake live data** — preview data is explicitly labeled.
5. **No response-body history** — local traceability without storing administrative payloads.

## License

MIT
