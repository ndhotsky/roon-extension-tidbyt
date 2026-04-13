const fs = require("fs");
const { LOCAL_SETTINGS_PATH } = require("./defaults");

function loadLocalFileSettings() {
    try {
        if (!fs.existsSync(LOCAL_SETTINGS_PATH)) return {};
        const data = fs.readFileSync(LOCAL_SETTINGS_PATH, "utf8");
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        console.error("Failed to read local-settings.json:", error.message);
        return {};
    }
}

module.exports = { loadLocalFileSettings };
