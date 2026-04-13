# roon-extension-tidbyt

A [Roon](https://roonlabs.com) extension that pushes **Now Playing** information to a [Tidbyt](https://tidbyt.com) display in real time.

When a track is playing in Roon, the extension renders a Tidbyt-native app (via [Pixlet](https://github.com/tidbyt/pixlet)) showing the song title, artist, album, and album art, then pushes the rendered image to your Tidbyt device over the Tidbyt cloud API.

![Roon Now Playing on Tidbyt](roon-tidbyt-preview.gif)

---

## How it works

```
Roon Core (local network)
        ├─ zone + now_playing events
        └─ album art bytes (Roon image service)
        ↓
roon-extension-tidbyt
        ├─ map event -> snapshot (title / artist / album / zone)
        ├─ pixlet render -> WebP
        └─ pixlet push -> Tidbyt API
        ↓
Tidbyt display updates
```

- The extension registers with Roon as a standard extension. No Roon modifications are required.
- Roon API is local-only (no public endpoint exists), so the extension must run on a machine on the same network as your Roon Core.
- Album art is fetched from Roon's internal image service and passed as a base64 argument to the Starlark renderer.
- Pushes are debounced (1.5 s default) and throttled (3 s minimum interval) to avoid hammering the Tidbyt API on rapid track changes.

---

## Prerequisites

| Requirement       | Notes                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Node.js 18+**   | `node --version` to check                                                                    |
| **Pixlet CLI**    | [Installation guide](https://github.com/tidbyt/pixlet#installation) — must be on your `PATH` |
| **Roon Core**     | Running on the same local network                                                            |
| **Tidbyt device** | Device ID and API token from the Tidbyt app                                                  |

---

## Installation

```bash
git clone https://github.com/ndhotsky/roon-extension-tidbyt.git
cd roon-extension-tidbyt
npm install
```

Or via npx (no git clone needed):

```bash
npx roon-extension-tidbyt
```

---

## Configuration

The extension reads configuration from three sources, in priority order (highest first):

1. **Environment variables** — best for automated / headless setups
2. **`local-settings.json`** — a local file at the project root (git-ignored)
3. **Roon settings UI** — configured interactively inside Roon

### Option A: Roon settings UI (recommended)

Start the extension (see [Running](#running)) and open Roon. Navigate to **Settings → Extensions**, find **Tidbyt Now Playing Display**, and click **Settings**. You will see:

- **Roon Zone** — a native dropdown listing all active zones by name
- **Tidbyt Device ID** — from the Tidbyt app under Settings → Developer
- **Tidbyt API Token** — from the Tidbyt app under Settings → Developer

Settings are persisted automatically inside Roon's own config store.

### Option B: `local-settings.json`

Copy the example file and fill in your values:

```bash
cp local-settings.example.json local-settings.json
```

```json
{
    "tidbyt_device_id": "your-tidbyt-device-id",
    "tidbyt_api_token": "your-tidbyt-api-token",
    "zone_id": ""
}
```

`zone_id` can be left blank if you set it via the Roon UI. Zone IDs are logged to stdout on startup once a Roon Core is paired.

### Option C: Environment variables

```bash
cp .env.example .env
# edit .env with your values
```

| Variable                     | Required | Description                                   |
| ---------------------------- | -------- | --------------------------------------------- |
| `TIDBYT_DEVICE_ID`           | Yes      | Your Tidbyt device ID                         |
| `TIDBYT_API_TOKEN`           | Yes      | Your Tidbyt API token                         |
| `ROON_ZONE_ID`               | No       | Roon zone ID (can be set via UI instead)      |
| `ROON_DEBOUNCE_MS`           | No       | Push debounce in ms (default: `1500`)         |
| `ROON_MIN_PUSH_INTERVAL_SEC` | No       | Minimum seconds between pushes (default: `3`) |

---

## Running

### Development / one-off

```bash
npm start
```

The extension will print known Roon zones to stdout once paired. Watch the Roon **Extensions** panel for the connection status.

### Background (PM2 — recommended for always-on use)

[PM2](https://pm2.keymetrics.io) keeps the process running and restarts it on crashes.

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save            # persist across reboots
pm2 startup         # generate OS startup command (follow the printed instruction)
```

Useful PM2 commands:

```bash
pm2 status                    # show process status
pm2 logs roon-extension-tidbyt  # tail logs
pm2 restart roon-extension-tidbyt
pm2 stop roon-extension-tidbyt
```

---

## Health check

```bash
npm run doctor
```

Verifies Node.js version, Pixlet availability, credential configuration, and runtime directory access. Exits with code 1 if any errors are found.

---

## Roon pairing

On first run, the extension appears in **Roon → Settings → Extensions** with a **Waiting for Roon core** status. Click **Enable** to pair. Roon stores the pairing state in `runtime/config.json` (git-ignored).

---

## Troubleshooting

**Extension shows "Pixlet CLI not found"**
Install Pixlet and ensure it is on your `PATH`. Run `pixlet version` to verify.

**Extension shows "Configure Tidbyt Device ID and API Token"**
Enter your credentials in the Roon extension settings UI or create a `local-settings.json`.

**Extension shows "Selected zone not currently available"**
The configured zone is not currently visible to Roon (the output may be powered off or unreachable). The extension will recover automatically when the zone comes back online.

**Album art is not appearing**
Album art requires a Roon Core that exposes `RoonApiImage`. Verify in the extension logs that `runtime.image` is non-null on startup.

**Push fails with a Pixlet error**
Run `npm run doctor` to confirm Pixlet is accessible, then inspect the error in the extension logs for details on the render or push step.

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
