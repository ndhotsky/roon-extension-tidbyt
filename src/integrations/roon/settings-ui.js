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
    return settingsModel.buildSettingsLayout(state.settingsState);
}

function getSettingsHandler(cb) {
    cb(_buildLayout());
}

function saveSettingsHandler(req, isDryRun, settings) {
    const incoming = settingsModel.settingsToObject(settings);
    const merged = Object.assign({}, state.settingsState, incoming);
    const normalized = settingsModel.normalizeSettings(merged, defaults);

    if (isDryRun) {
        const previewLayout = settingsModel.buildSettingsLayout(normalized);
        req.send_complete("Success", { settings: previewLayout });
        return;
    }

    Object.assign(state.settingsState, normalized);
    configStore.saveSettings();

    const updatedLayout = _buildLayout();
    req.send_complete("Success", { settings: updatedLayout });
    if (_svcSettings) _svcSettings.update_settings(updatedLayout);
    statusService.update("Settings saved", false);
    pushService.maybeSchedulePush();
}

module.exports = { init, getSettingsHandler, saveSettingsHandler };
