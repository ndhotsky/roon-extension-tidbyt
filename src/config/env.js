function loadEnvSettings() {
    const fromEnv = {};
    if (process.env.TIDBYT_DEVICE_ID) fromEnv.tidbyt_device_id = process.env.TIDBYT_DEVICE_ID;
    if (process.env.TIDBYT_API_TOKEN) fromEnv.tidbyt_api_token = process.env.TIDBYT_API_TOKEN;
    if (process.env.ROON_ZONE_ID) fromEnv.zone_id = process.env.ROON_ZONE_ID;
    if (process.env.ROON_DEBOUNCE_MS) fromEnv.debounce_ms = process.env.ROON_DEBOUNCE_MS;
    if (process.env.ROON_MIN_PUSH_INTERVAL_SEC) fromEnv.min_push_interval_sec = process.env.ROON_MIN_PUSH_INTERVAL_SEC;
    return fromEnv;
}

module.exports = { loadEnvSettings };
