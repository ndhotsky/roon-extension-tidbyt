const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { RUNTIME_DIR, PROJECT_ROOT } = require("../config/defaults");

/**
 * Ensures the process CWD is runtime/ so Roon writes config.json there instead of
 * the source tree. Also migrates any legacy config.json from the project root.
 */
function ensureProcessWorkingDirectory() {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });

    const legacyConfig = path.join(PROJECT_ROOT, "config.json");
    const runtimeConfig = path.join(RUNTIME_DIR, "config.json");
    if (fs.existsSync(legacyConfig) && !fs.existsSync(runtimeConfig)) {
        try {
            fs.copyFileSync(legacyConfig, runtimeConfig);
            console.log("Migrated config.json to runtime/");
        } catch (_) {
            // non-fatal
        }
    }

    if (process.cwd() === RUNTIME_DIR) return;
    try {
        process.chdir(RUNTIME_DIR);
    } catch (error) {
        console.warn(`Failed to set working directory to ${RUNTIME_DIR}: ${error.message}`);
    }
}

function checkPixletAvailable() {
    const result = spawnSync("pixlet", ["version"], { stdio: "pipe", encoding: "utf8" });
    return !result.error && result.status === 0;
}

module.exports = { ensureProcessWorkingDirectory, checkPixletAvailable };
