const RoonApi = require("node-roon-api");
const RoonApiImage = require("node-roon-api-image");
const RoonApiSettings = require("node-roon-api-settings");
const RoonApiStatus = require("node-roon-api-status");
const RoonApiTransport = require("node-roon-api-transport");

const state = require("../../state");
const configStore = require("../../config/store");
const statusService = require("../../services/status-service");
const pushService = require("../../services/push-service");
const zonesModule = require("./zones");
const settingsUi = require("./settings-ui");
const { version } = require("../../../package.json");

function createRoonClient() {
    const roon = new RoonApi({
        extension_id:    "com.ndhotsky.tidbyt",
        display_name:    "Tidbyt Now Playing Display",
        display_version: version,
        publisher:       "ndhotsky",
        email:           "nate@nhotsky.dev",
        website:         "https://github.com/ndhotsky/roon-extension-tidbyt",
        log_level:       "none",

        core_paired(core) {
            state.runtime.transport = core.services.RoonApiTransport;
            state.runtime.image     = core.services.RoonApiImage || core.services["com.roonlabs.image:1"] || null;
            statusService.update("Connected to Roon core", false);
            zonesModule.subscribeZones();
        },

        core_unpaired() {
            state.runtime.transport = null;
            state.runtime.image     = null;
            state.runtime.zonesById = {};
            pushService.clearPendingPush();
            statusService.update("Roon core unpaired", true);
        },
    });

    const svcStatus = new RoonApiStatus(roon);
    const svcSettings = new RoonApiSettings(roon, {
        get_settings:  settingsUi.getSettingsHandler,
        save_settings: settingsUi.saveSettingsHandler,
        button_pressed: settingsUi.buttonPressedHandler,
    });

    roon.init_services({
        required_services: [RoonApiTransport, RoonApiImage],
        provided_services:  [svcStatus, svcSettings],
    });

    statusService.init(svcStatus);
    settingsUi.init(svcSettings);
    configStore.init(roon);

    return roon;
}

module.exports = { createRoonClient };
