const state = require("../state");
const defaults = require("./defaults");
const settingsModel = require("../domain/settings-model");
const { loadEnvSettings } = require("./env");
const { loadLocalFileSettings } = require("./local-file");

let _roon = null;

function init(roon) {
    _roon = roon;
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
    settingsModel.applyNormalizedSettings(state.settingsState, merged, defaults.SETTINGS_DEFAULTS);
}

function saveSettings() {
    if (_roon) {
        _roon.save_config(defaults.SETTINGS_KEY, state.settingsState);
    }
}

module.exports = { init, loadSettings, saveSettings };
