const state = require("../state");
const defaults = require("../config/defaults");
const settingsModel = require("../domain/settings-model");
const snapshotDomain = require("../domain/snapshot");
const renderer = require("../integrations/pixlet/renderer");
const artwork = require("../integrations/pixlet/artwork");
const statusService = require("./status-service");

function clearPendingPush() {
    if (state.runtime.debounceTimer) {
        clearTimeout(state.runtime.debounceTimer);
        state.runtime.debounceTimer = null;
    }
    state.runtime.pendingSnapshot = null;
}

function maybeSchedulePush() {
    const result = snapshotDomain.buildNowPlayingSnapshot(state.settingsState.zone_id, state.runtime.zonesById);
    if (result.error) {
        statusService.update(result.error, true);
        return;
    }
    const snapshot = result.snapshot;
    if (!snapshot) return;

    const snapshotKey = snapshotDomain.snapshotToKey(snapshot);
    if (snapshotKey === state.runtime.lastSnapshotKey) return;
    const pendingSnapshotKey = state.runtime.pendingSnapshot
        ? snapshotDomain.snapshotToKey(state.runtime.pendingSnapshot)
        : "";
    if (snapshotKey === pendingSnapshotKey && (state.runtime.debounceTimer || state.runtime.pushInFlight)) return;

    state.runtime.pendingSnapshot = snapshot;
    if (state.runtime.debounceTimer) clearTimeout(state.runtime.debounceTimer);
    state.runtime.debounceTimer = setTimeout(() => {
        state.runtime.debounceTimer = null;
        _pushPendingSnapshot();
    }, settingsModel.parseInteger(state.settingsState.debounce_ms, defaults.DEFAULT_DEBOUNCE_MS));
}

function _pushPendingSnapshot() {
    const snapshot = state.runtime.pendingSnapshot;
    if (!snapshot || state.runtime.pushInFlight) return;

    if (!state.settingsState.tidbyt_device_id || !state.settingsState.tidbyt_api_token) {
        statusService.update("Configure Tidbyt Device ID and API Token in extension settings.", true);
        return;
    }
    if (!state.runtime.pixletAvailable) {
        statusService.update("Pixlet CLI not found on PATH. Install Pixlet before enabling pushes.", true);
        return;
    }

    const minIntervalMs = settingsModel.parseInteger(
        state.settingsState.min_push_interval_sec,
        defaults.DEFAULT_MIN_PUSH_INTERVAL_SEC
    ) * 1000;
    const waitMs = minIntervalMs - (Date.now() - state.runtime.lastPushAtMs);
    if (waitMs > 0) {
        state.runtime.debounceTimer = setTimeout(() => {
            state.runtime.debounceTimer = null;
            _pushPendingSnapshot();
        }, waitMs);
        return;
    }

    const pendingSnapshotKey = snapshotDomain.snapshotToKey(snapshot);
    state.runtime.pushInFlight = true;

    _renderAndPush(snapshot)
        .then(() => {
            state.runtime.lastSnapshotKey = pendingSnapshotKey;
            state.runtime.lastPushAtMs = Date.now();
            state.runtime.pendingSnapshot = null;
            statusService.update("Last push succeeded", false);
        })
        .catch((error) => {
            statusService.update("Push failed: " + error.message, true);
        })
        .finally(() => {
            state.runtime.pushInFlight = false;
            if (
                state.runtime.pendingSnapshot &&
                snapshotDomain.snapshotToKey(state.runtime.pendingSnapshot) !== state.runtime.lastSnapshotKey
            ) {
                maybeSchedulePush();
            }
        });
}

async function _renderAndPush(snapshot) {
    const artworkB64 = await artwork.fetchAlbumArtBase64(snapshot.imageKey);
    const enrichedSnapshot = Object.assign({}, snapshot, { artworkB64 });
    return renderer.renderAndPush({
        snapshot: enrichedSnapshot,
        settingsState: state.settingsState,
        pixletPath: defaults.PIXLET_APP_PATH,
        renderOutputPath: defaults.RENDER_OUTPUT_PATH,
        workingDirectory: defaults.PROJECT_ROOT,
    });
}

module.exports = { clearPendingPush, maybeSchedulePush };
