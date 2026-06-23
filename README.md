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
- **OTA packages & deployment** — build Unitree `.upk` packages from a list of commands, then deploy them to all robots, a group, or a list of serials. Canopy serves the package over HTTP, sends each robot an `updateModule` command, and tracks per-robot progress (`sent → downloading → completed/failed`).
- **Auth & audit** — JWT auth with `admin`/`operator`/`viewer` roles; sensitive actions are written to an audit log.
- **Web UI** — React dashboard served by the same process.

## Quick start

### Docker (recommended)

```bash
# Optional: pin a known signing key (otherwise one is generated on first boot).
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
> Change the admin password immediately (`PUT /api/v1/auth/password`, or via the UI). If you don't set `CANOPY_SECRET_KEY`, Canopy generates a random one on first boot and persists it to `data/secret_key` so issued tokens survive restarts — set it explicitly when you need a known key across redeploys or multiple instances.

## Connecting a robot

Canopy is a drop-in replacement for Unitree's cloud broker, so **you don't install anything on the robot**. The stock on-board OTA agent (`ota_boxed`) already connects to `global-robot-mqtt.unitree.com:17883` over TLS and authenticates with the robot's serial. Pointing that hostname at your Canopy instance is all it takes — the robot auto-registers and shows up in the fleet view on its next connection.

### 1. Find the robot's serial

The serial is what Canopy uses to identify and authenticate the robot. On a Go2 it lives at `/unitree/robot/basic/code`:

```bash
ssh root@<robot-ip>
cat /unitree/robot/basic/code     # e.g. B42D1000O747MN8Y
```

### 2. Point the robot at Canopy

Pick one of two approaches on the robot.

**Option A — DNS/hosts redirect (no robot config changes).** Redirect Unitree's broker hostnames to your Canopy host so the unmodified agent dials Canopy. Add to the robot's `/etc/hosts`:

```
<canopy-host-ip>   global-robot-mqtt.unitree.com
<canopy-host-ip>   robot-mqtt.unitree.com
```

Canopy's self-signed broker cert is issued for exactly these hostnames, so TLS lines up. (If the robot pins or verifies a CA you'll need to install Canopy's CA from `data/certs/ca.pem`; the stock Go2 agent does not verify.)

**Option B — edit the MQTT client config.** Point the agent directly at your host/IP in `/unitree/etc/mqtt/mqtt_client_conf.json`, leaving the broker hostnames alone.

Either way the robot connects to port `17883`. Restart the agent or reboot the robot to force a reconnect.

### 3. Make sure Canopy is reachable

- The broker port (`17883`, TLS by default) must be reachable **from the robot**.
- For OTA, set `CANOPY_UPK_ADVERTISE_HOST` to an address the robot can reach (see [Configuration](#configuration)) — it goes into the package download URL.
- The robot and Canopy host need to be on the same network or otherwise routable to each other.

### 4. Confirm in the fleet view

Open the Web UI at `http://<canopy-host>:8080`. On the robot's next connection it registers automatically and appears in the fleet view, where you can see its status and live connect/message events, send it commands, and target it for OTA deployments.

> [!NOTE]
> Authentication uses Unitree's publicly known scheme: client id `unitree_robot_<serial>`, username = serial, password `1|md5("unitree-<serial>-<nonce>")|<nonce>` (see [`canopy/broker/auth.py`](canopy/broker/auth.py)). Any client that can reach the broker port and speak this scheme can register, so restrict access at the network layer (or set the broker's `allowed_serials`) when testing against hardware that isn't yours. Set `CANOPY_MQTT_REQUIRE_AUTH=false` only for a quick local bring-up — it accepts any client.

## Configuration

All settings are environment variables prefixed with `CANOPY_`:

| Variable | Default | Description |
|---|---|---|
| `CANOPY_SECRET_KEY` | _(auto-generated)_ | JWT signing key. If unset, a random key is generated on first boot and saved to `data/secret_key`. Override to pin a known key across instances. |
| `CANOPY_HOST` | `0.0.0.0` | API bind address |
| `CANOPY_API_PORT` | `8080` | API / UI port |
| `CANOPY_MQTT_HOST` | `0.0.0.0` | Broker bind address |
| `CANOPY_MQTT_PORT` | `17883` | Broker port |
| `CANOPY_MQTT_USE_TLS` | `true` | Serve the broker over TLS (auto-generates a self-signed cert if no paths given) |
| `CANOPY_MQTT_REQUIRE_AUTH` | `true` | Require Unitree serial-based auth; `false` accepts any client |
| `CANOPY_MQTT_CERT_PATH` / `CANOPY_MQTT_KEY_PATH` | unset | Use your own broker cert/key instead of self-signed |
| `CANOPY_DATABASE_URL` | `sqlite+aiosqlite:///./canopy.db` | SQLAlchemy async DB URL |
| `CANOPY_UPK_SERVER_PORT` | `8899` | Port the OTA file server serves `.upk` packages on |
| `CANOPY_UPK_ADVERTISE_HOST` | `127.0.0.1` | Host/IP robots use to reach the OTA file server. Goes into the download URL in the `updateModule` command, so it must be reachable **from the robot**. Set this for any real deployment. |
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

`v0.1.0` (alpha). Working: broker, fleet tracking, commands, package build/download, OTA deployment orchestration, auth/RBAC, audit log, live event WebSockets. The full broker → auth → deploy → UPK download → report loop has been verified end-to-end against a live Go2.

**Known limitations (alpha):**
- **Rollout is immediate only** — packages dispatch to all matching connected robots at once. Phased/staged rollout is not implemented.
- **No schema migrations** — the database is created on startup; expect to reset it between versions.
- **No login rate limiting**, and audit-log export loads all matching rows into memory.
- **No DDS telemetry or video** — these integrations are stubbed, not implemented.

> [!NOTE]
> The terminal `completed`/`failed` transition comes from the robot's `reportVersion` OTA message; `sent`/`downloading` are driven by concrete signals (MQTT publish, file-server hit). The report format was confirmed against Go2 firmware — see `handle_report` in [`canopy/packages/deployment.py`](canopy/packages/deployment.py).

## License

MIT
