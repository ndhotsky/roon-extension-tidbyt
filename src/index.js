const { ensureProcessWorkingDirectory, checkPixletAvailable } = require("./utils/process");
const { ensureRuntimeDirs } = require("./integrations/pixlet/renderer");
const { createRoonClient } = require("./integrations/roon/client");
const configStore = require("./config/store");
const statusService = require("./services/status-service");
const state = require("./state");
const defaults = require("./config/defaults");

// Must run first: chdir to runtime/ so Roon writes config.json there
ensureProcessWorkingDirectory();

const roon = createRoonClient();

configStore.loadSettings();
ensureRuntimeDirs(defaults.RENDER_OUTPUT_PATH);

state.runtime.pixletAvailable = checkPixletAvailable();
statusService.update(
    state.runtime.pixletAvailable
        ? "Waiting for Roon core"
        : "Pixlet CLI not found on PATH. Install Pixlet before enabling pushes.",
    !state.runtime.pixletAvailable
);

roon.start_discovery();
