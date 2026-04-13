const state = require("../../state");
const defaults = require("../../config/defaults");
const settingsModel = require("../../domain/settings-model");
const configStore = require("../../config/store");
const pushService = require("../../services/push-service");
const statusService = require("../../services/status-service");

let _svcSettings = null;

function init(svcSettings) {
    _svcSettings = svcSettings;
}

function _buildLayout() {
    return settingsModel.buildSettingsLayout(
        { settingsState: state.settingsState, defaults: defaults.SETTINGS_DEFAULTS }
    );
}

function getSettingsHandler(cb) {
    cb(_buildLayout());
}

function saveSettingsHandler(req, isDryRun, settings) {
    const incoming = settingsModel.settingsToObject(settings);
    const merged = Object.assign({}, state.settingsState, incoming);
    const normalized = settingsModel.normalizeSettings(merged, defaults.SETTINGS_DEFAULTS);

    if (isDryRun) {
        const previewLayout = settingsModel.buildSettingsLayout(
            { settingsState: normalized, defaults: defaults.SETTINGS_DEFAULTS }
        );
        req.send_complete("Success", { settings: previewLayout });
        return;
    }

    settingsModel.applyNormalizedSettings(state.settingsState, normalized, defaults.SETTINGS_DEFAULTS);
    configStore.saveSettings();

    const updatedLayout = _buildLayout();
    req.send_complete("Success", { settings: updatedLayout });
    if (_svcSettings) _svcSettings.update_settings(updatedLayout);
    statusService.update("Settings saved", false);
    pushService.maybeSchedulePush();
}

function buttonPressedHandler(req, _buttonId, _settings) {
    req.send_complete("Success", { settings: _buildLayout() });
}

module.exports = { init, getSettingsHandler, saveSettingsHandler, buttonPressedHandler };
