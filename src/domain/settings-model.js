function parseInteger(value, fallback, min = 0, max = 300000) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function normalizeSettingString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function toLayoutString(value, maxLength) {
    const text = String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    return text.slice(0, maxLength);
}

function extractZoneId(zoneValue) {
    if (!zoneValue) return "";
    if (typeof zoneValue === "string") return zoneValue.trim();
    if (typeof zoneValue === "object") {
        return normalizeSettingString(zoneValue.output_id || zoneValue.zone_id || "");
    }
    return "";
}

function resolveZoneObject(settingsState) {
    const zoneId = settingsState.zone_id;
    if (!zoneId) return null;
    if (typeof settingsState.zone === "object" && settingsState.zone !== null) {
        return settingsState.zone;
    }
    return { output_id: zoneId, zone_id: zoneId };
}

function normalizeSettings(raw, defaults) {
    const zoneId = raw.zone_id || extractZoneId(raw.zone);
    return {
        tidbyt_device_id: normalizeSettingString(raw.tidbyt_device_id),
        tidbyt_api_token: normalizeSettingString(raw.tidbyt_api_token),
        zone_id: normalizeSettingString(zoneId),
        zone: (typeof raw.zone === "object" && raw.zone !== null) ? raw.zone : null,
        debounce_ms: parseInteger(raw.debounce_ms, defaults.DEFAULT_DEBOUNCE_MS),
        min_push_interval_sec: parseInteger(raw.min_push_interval_sec, defaults.DEFAULT_MIN_PUSH_INTERVAL_SEC),
    };
}

function applyNormalizedSettings(settingsState, rawSettings, defaults) {
    const normalized = normalizeSettings(rawSettings, defaults);
    settingsState.tidbyt_device_id = normalized.tidbyt_device_id;
    settingsState.tidbyt_api_token = normalized.tidbyt_api_token;
    settingsState.zone_id = normalized.zone_id;
    settingsState.zone = normalized.zone;
    settingsState.debounce_ms = normalized.debounce_ms;
    settingsState.min_push_interval_sec = normalized.min_push_interval_sec;
    return normalized;
}

function settingsToObject(settings) {
    if (!settings) return {};

    let raw;
    if (!Array.isArray(settings)) {
        if (settings.values && typeof settings.values === "object") {
            raw = Array.isArray(settings.values) ? arrayToMap(settings.values) : settings.values;
        } else {
            raw = settings;
        }
    } else {
        raw = arrayToMap(settings);
    }

    if (raw.zone && typeof raw.zone === "object") {
        raw.zone_id = extractZoneId(raw.zone);
    }
    return raw;
}

function arrayToMap(arr) {
    const mapped = {};
    arr.forEach((entry) => {
        if (!entry || !entry.setting) return;
        mapped[entry.setting] = entry.value;
    });
    return mapped;
}

function buildSettingsLayout(input) {
    const { settingsState } = input;
    const values = {
        tidbyt_device_id: toLayoutString(settingsState.tidbyt_device_id, 256),
        tidbyt_api_token: toLayoutString(settingsState.tidbyt_api_token, 4096),
        zone: resolveZoneObject(settingsState),
    };
    return {
        values,
        layout: [
            { type: "zone",   title: "Roon Zone",        setting: "zone" },
            { type: "string", title: "Tidbyt Device ID",  setting: "tidbyt_device_id" },
            { type: "string", title: "Tidbyt API Token",  setting: "tidbyt_api_token" },
        ],
        has_error: false,
    };
}

module.exports = {
    applyNormalizedSettings,
    buildSettingsLayout,
    normalizeSettings,
    parseInteger,
    settingsToObject,
};
