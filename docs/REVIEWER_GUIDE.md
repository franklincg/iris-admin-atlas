# Reviewer Guide — IRIS Admin Atlas 1.1

This short path is designed to show the project’s value in about two minutes.

## 1. Start the environment

```bash
docker compose up --build -d
```

Open:

```text
http://localhost:52773/csp/admin-atlas/index.html
```

The first screen deliberately contains a clearly labeled sample operational snapshot so the interface is understandable before authentication.

## 2. Connect to IRIS

Sign in if prompted and click **Connect to IRIS**.

The sample snapshot is replaced by live read-only information from the current IRIS instance:

- process count and representative process rows
- configured web applications
- security users
- scheduled tasks
- audit status

The dashboard never labels sample values as live.

## 3. Search the management surface

Use **Action Atlas** and search for terms such as:

- `audit`
- `OAuth`
- `process`
- `role`
- `task`
- `journal`

Each result exposes the API method, path, purpose, privilege requirement, and risk class.

## 4. Run a safe request

Choose a green **SAFE READ** action and click **Run safe request**.

Normal GET operations are supported, as well as explicitly classified read-only POST searches such as audit-record and journal-record queries.

The result panel shows the HTTP status, request time, and JSON response.

## 5. Inspect a dangerous action

Search for `terminate` and select the process termination endpoint.

The UI exposes the exact path and required privilege but will not execute it. It remains preview-only.

This is the project’s core safety boundary: discovery is broad, execution is deliberately narrow.

## 6. Check traceability

Run a few safe reads and open **Local Run History**.

History records only request metadata:

- time
- method
- path
- status
- duration

Response bodies are not persisted.

## What to evaluate

### Usefulness

Atlas turns a large SysAdmin REST surface into a task-oriented interface that helps operators find the correct API and privilege quickly.

### Developer experience

The repository has a one-command Docker Compose path, a small static frontend, an IRIS-served CSP application, and a validation test for catalog safety/coverage.

### Safety

The execution guard is data-driven. Only actions explicitly marked `risk: "read"` can run. Write and destructive actions are still discoverable and previewable without being sent.

### Transparency

The interface does not hide API details. Operators always see the HTTP method, path, privilege, and risk classification behind an action.
