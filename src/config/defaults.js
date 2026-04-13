const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const SETTINGS_KEY = "tidbyt_settings_v1";
const DEFAULT_INSTALLATION_ID = "Roon";
const DEFAULT_DEBOUNCE_MS = 1500;
const DEFAULT_MIN_PUSH_INTERVAL_SEC = 3;

const RUNTIME_DIR = path.join(PROJECT_ROOT, "runtime");
const PIXLET_APP_PATH = path.join(PROJECT_ROOT, "pixlet", "roon_now_playing.star");
const RENDER_OUTPUT_PATH = path.join(RUNTIME_DIR, "tmp", "roon_now_playing.webp");
const LOCAL_SETTINGS_PATH = path.join(PROJECT_ROOT, "local-settings.json");

const PIXLET_RENDER_TIMEOUT_MS = 30000;
const PIXLET_PUSH_TIMEOUT_MS = 20000;

const SETTINGS_DEFAULTS = {
    DEFAULT_INSTALLATION_ID,
    DEFAULT_DEBOUNCE_MS,
    DEFAULT_MIN_PUSH_INTERVAL_SEC,
};

module.exports = {
    PROJECT_ROOT,
    SETTINGS_KEY,
    DEFAULT_INSTALLATION_ID,
    DEFAULT_DEBOUNCE_MS,
    DEFAULT_MIN_PUSH_INTERVAL_SEC,
    RUNTIME_DIR,
    PIXLET_APP_PATH,
    RENDER_OUTPUT_PATH,
    LOCAL_SETTINGS_PATH,
    PIXLET_RENDER_TIMEOUT_MS,
    PIXLET_PUSH_TIMEOUT_MS,
    SETTINGS_DEFAULTS,
};
