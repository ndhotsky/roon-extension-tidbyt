const fs = require("fs");
const { spawnSync } = require("child_process");
const { RUNTIME_DIR } = require("../config/defaults");

/**
 * Ensures the process CWD is runtime/ so Roon writes config.json there instead of
 * the source tree.
 */
function ensureProcessWorkingDirectory() {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });

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
