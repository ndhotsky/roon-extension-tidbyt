const fs = require("fs");
const state = require("../state");
const defaults = require("./defaults");
const settingsModel = require("../domain/settings-model");

let _roon = null;

function init(roon) {
    _roon = roon;
}

function loadEnvSettings() {
    const settings = {};
    if (process.env.TIDBYT_DEVICE_ID) settings.tidbyt_device_id = process.env.TIDBYT_DEVICE_ID;
    if (process.env.TIDBYT_API_TOKEN) settings.tidbyt_api_token = process.env.TIDBYT_API_TOKEN;
    if (process.env.ROON_ZONE_ID) settings.zone_id = process.env.ROON_ZONE_ID;
    if (process.env.ROON_DEBOUNCE_MS) settings.debounce_ms = process.env.ROON_DEBOUNCE_MS;
    if (process.env.ROON_MIN_PUSH_INTERVAL_SEC) settings.min_push_interval_sec = process.env.ROON_MIN_PUSH_INTERVAL_SEC;
    return settings;
}

function loadLocalFileSettings() {
    try {
        if (!fs.existsSync(defaults.LOCAL_SETTINGS_PATH)) return {};
        const parsed = JSON.parse(fs.readFileSync(defaults.LOCAL_SETTINGS_PATH, "utf8"));
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        console.error("Failed to read local-settings.json:", error.message);
        return {};
    }
}

/**
 * Loads settings from (in priority order): env vars > local-settings.json > saved Roon config.
 * Applies normalized values to the shared settingsState.
 */
function loadSettings() {
    const saved = _roon ? _roon.load_config(defaults.SETTINGS_KEY) : null;
    const merged = Object.assign(
        {},
        saved && typeof saved === "object" ? saved : {},
        loadLocalFileSettings(),
        loadEnvSettings()
    );
    Object.assign(state.settingsState, settingsModel.normalizeSettings(merged, defaults));
}

function saveSettings() {
    if (_roon) {
        _roon.save_config(defaults.SETTINGS_KEY, state.settingsState);
    }
}

module.exports = { init, loadSettings, saveSettings };
