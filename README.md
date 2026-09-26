# IRIS Admin Atlas

IRIS Admin Atlas is a read-only management cockpit for InterSystems IRIS 2026.2. It groups the official SysAdmin REST surface into a searchable action catalog with privilege hints, live read-only requests, request previews, and browser-local history.

## Features
- system resource and process views
- web application inventory
- users, roles, resources, and privilege discovery
- audit and OAuth2 configuration discovery
- scheduled task and async job inspection
- device and journal discovery
- mutating actions are visible for review but are never sent

## Run
Build the included Dockerfile and expose IRIS port 52773. Then open:

http://localhost:52773/csp/admin-atlas/index.html

The page is served from the IRIS origin and calls /api/admin and /api/admin/v2 using the current authenticated browser session.

## Manual install
Copy the files under web/ into an IRIS CSP static directory named admin-atlas and expose it at /csp/admin-atlas/.

## Contest scope
The interface covers web apps, permissions, security, tasks, system operations, and logs. The endpoint catalog was curated from the official InterSystems SysAdmin API specification:

https://github.com/intersystems-community/sysadmin-api-specification

## Safety
Only GET requests are executable. Mutating endpoints are displayed as request previews so operators can inspect paths and privilege requirements without changing a system.

## License
MIT
