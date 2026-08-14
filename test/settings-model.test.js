const assert = require("node:assert/strict");
const test = require("node:test");

const defaults = require("../src/config/defaults");
const settingsModel = require("../src/domain/settings-model");

test("normalizes direct and Roon-wrapped settings", () => {
    const zone = { output_id: " output-1 ", zone_id: "zone-1" };
    const raw = {
        tidbyt_device_id: " device ",
        tidbyt_api_token: " token ",
        zone,
        debounce_ms: "-1",
        min_push_interval_sec: "999999",
    };

    for (const input of [raw, { values: raw }]) {
        const normalized = settingsModel.normalizeSettings(
            settingsModel.settingsToObject(input),
            defaults
        );

        assert.deepEqual(normalized, {
            tidbyt_device_id: "device",
            tidbyt_api_token: "token",
            zone_id: "output-1",
            zone,
            debounce_ms: 0,
            min_push_interval_sec: 300000,
        });
    }
});
