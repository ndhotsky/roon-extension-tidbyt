const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const defaults = require("../../config/defaults");

function ensureRuntimeDirs(renderOutputPath) {
    fs.mkdirSync(path.dirname(renderOutputPath), { recursive: true });
}

function renderAndPush(input) {
    const {
        snapshot,
        settingsState,
        pixletPath,
        renderOutputPath,
        workingDirectory,
    } = input;

    if (!fs.existsSync(pixletPath)) {
        return Promise.reject(new Error("Pixlet app file not found at " + pixletPath));
    }

    const renderArgs = [
        "render",
        pixletPath,
        "title="       + snapshot.title,
        "subtitle="    + snapshot.subtitle,
        "album="       + snapshot.album,
        "zone_name="   + snapshot.zoneName,
        "artwork_b64=" + (snapshot.artworkB64 || ""),
        "--output",
        renderOutputPath,
    ];

    return runCommand("pixlet", renderArgs, defaults.PIXLET_RENDER_TIMEOUT_MS, workingDirectory).then(() => {
        const pushArgs = [
            "push",
            settingsState.tidbyt_device_id,
            renderOutputPath,
            "--api-token",       settingsState.tidbyt_api_token,
            "--installation-id", defaults.DEFAULT_INSTALLATION_ID,
        ];
        return runCommand("pixlet", pushArgs, defaults.PIXLET_PUSH_TIMEOUT_MS, workingDirectory);
    });
}

function runCommand(command, args, timeoutMs, workingDirectory) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ["ignore", "pipe", "pipe"],
            cwd: workingDirectory,
        });
        let stdout = "";
        let stderr = "";
        let timeoutId = null;

        if (timeoutMs > 0) {
            timeoutId = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
        }

        child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
        child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
        child.on("error", (error) => reject(new Error(error.message)));
        child.on("close", (code) => {
            if (timeoutId) clearTimeout(timeoutId);
            if (code === 0) { resolve(stdout.trim()); return; }
            const details = [
                `${command} exited with code ${code}`,
                stderr.trim() ? `stderr: ${stderr.trim()}` : "",
                stdout.trim() ? `stdout: ${stdout.trim()}` : "",
            ].filter(Boolean).join(" | ");
            reject(new Error(details));
        });
    });
}

module.exports = { ensureRuntimeDirs, renderAndPush };
