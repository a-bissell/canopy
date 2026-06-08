# Canopy

Self-hosted fleet management for Unitree robots.

Canopy stands in for Unitree's cloud MQTT broker (`global-robot-mqtt.unitree.com:17883`). Robots that are pointed at a Canopy instance connect to it instead of the vendor cloud, letting you observe the fleet, issue commands, and build/serve OTA (`.upk`) packages from infrastructure you control.

It was built as security research and presented at WISCON 2026.

> [!WARNING]
> **Trust model.** Canopy intentionally impersonates Unitree's broker and can push arbitrary shell commands to connected robots via OTA packages. Run it only against hardware you own or are explicitly authorized to test. Anyone who can reach the broker port and speak Unitree's (publicly known, MD5-based) auth scheme can register a robot unless you restrict `allowed_serials`.

## Features

- **MQTT broker** — a from-scratch MQTT 3.1.1 server that speaks Unitree's serial-based auth, with optional TLS.
- **Fleet view** — robots auto-register on connect; track status, group them, see live connect/disconnect/message events over WebSocket.
- **Commands** — send a command to one robot or broadcast to the fleet.
- **OTA packages** — build Unitree `.upk` packages from a list of commands and download them. *(End-to-end deployment to robots is not yet wired — see Status.)*
- **Auth & audit** — JWT auth with `admin`/`operator`/`viewer` roles; sensitive actions are written to an audit log.
- **Web UI** — React dashboard served by the same process.

## Quick start

### Docker (recommended)

```bash
# Generate a real secret before exposing this anywhere.
export CANOPY_SECRET_KEY="$(openssl rand -hex 32)"
docker compose up --build
```

- Web UI / API: http://localhost:8080
- MQTT broker: port 17883

### From source

```bash
pip install -e .
cd frontend && npm ci && npm run build && cd ..   # builds the UI into frontend/dist
python -m canopy
```

On first start Canopy creates a default admin account and logs the credentials:

```
username: admin
password: canopy
```

> [!IMPORTANT]
> Change the admin password immediately (`PUT /api/v1/auth/password`, or via the UI) and set a strong `CANOPY_SECRET_KEY` **before** the first run. Tokens are signed with that key — leaving the default makes them forgeable.

## Configuration

All settings are environment variables prefixed with `CANOPY_`:

| Variable | Default | Description |
|---|---|---|
| `CANOPY_SECRET_KEY` | `change-me-in-production` | JWT signing key. **Override in production.** |
| `CANOPY_HOST` | `0.0.0.0` | API bind address |
| `CANOPY_API_PORT` | `8080` | API / UI port |
| `CANOPY_MQTT_HOST` | `0.0.0.0` | Broker bind address |
| `CANOPY_MQTT_PORT` | `17883` | Broker port |
| `CANOPY_MQTT_USE_TLS` | `true` | Serve the broker over TLS (auto-generates a self-signed cert if no paths given) |
| `CANOPY_MQTT_REQUIRE_AUTH` | `true` | Require Unitree serial-based auth; `false` accepts any client |
| `CANOPY_MQTT_CERT_PATH` / `CANOPY_MQTT_KEY_PATH` | unset | Use your own broker cert/key instead of self-signed |
| `CANOPY_DATABASE_URL` | `sqlite+aiosqlite:///./canopy.db` | SQLAlchemy async DB URL |
| `CANOPY_CORS_ORIGINS` | `["http://localhost:5173","http://127.0.0.1:5173"]` | Browser origins allowed to call the API (JSON list). The bundled UI is same-origin, so this only matters for the standalone Vite dev server. |

## Development

```bash
pip install -e .
python -m canopy                 # API + broker on :8080 / :17883

cd frontend
npm ci
npm run dev                      # Vite dev server on :5173, proxying to :8080
```

## Status

`v0.1.0` (alpha). Working: broker, fleet tracking, commands, package build/download, auth/RBAC, audit log, live event WebSockets. Not yet implemented: end-to-end OTA deployment orchestration, DDS telemetry ingestion, and video. Automated tests and Alembic migrations are not in place yet (schema is created on startup).

## License

MIT
