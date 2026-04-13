const defaults = require("./config/defaults");

/**
 * Mutable settings persisted to Roon config and overridable via env / local-settings.json.
 * Written to by config/store.js and integrations/roon/settings-ui.js.
 */
const settingsState = {
    tidbyt_device_id: "",
    tidbyt_api_token: "",
    zone_id: "",
    zone: null,
    debounce_ms: defaults.DEFAULT_DEBOUNCE_MS,
    min_push_interval_sec: defaults.DEFAULT_MIN_PUSH_INTERVAL_SEC,
};

/**
 * Transient runtime state — Roon connection, zone cache, push lifecycle.
 * Never persisted.
 */
const runtime = {
    transport: null,
    image: null,
    zonesById: {},
    debounceTimer: null,
    lastSnapshotKey: "",
    pendingSnapshot: null,
    pushInFlight: false,
    lastPushAtMs: 0,
    lastStatusMessage: "",
    lastStatusIsError: null,
    pixletAvailable: false,
};

module.exports = { settingsState, runtime };
