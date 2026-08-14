const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { RUNTIME_DIR, RENDER_OUTPUT_PATH } = require("../config/defaults");

/**
 * Ensures the process CWD is runtime/ so Roon writes config.json there instead of
 * the source tree.
 */
function ensureProcessWorkingDirectory() {
    fs.mkdirSync(path.dirname(RENDER_OUTPUT_PATH), { recursive: true });

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
