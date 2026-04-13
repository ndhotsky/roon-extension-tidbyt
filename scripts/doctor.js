#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const defaults = require("../src/config/defaults");

const errors = [];
const warnings = [];
const checks = [];

function recordOk(message)      { checks.push(`OK:   ${message}`); }
function recordWarning(message) { warnings.push(`WARN: ${message}`); }
function recordError(message)   { errors.push(`ERROR: ${message}`); }

function hasEnv(name) {
    return typeof process.env[name] === "string" && process.env[name].trim() !== "";
}

function checkNode() {
    const major = Number.parseInt((process.versions.node || "0").split(".")[0], 10);
    if (Number.isNaN(major) || major < 18) {
        recordError(`Node.js 18+ required (found ${process.versions.node || "unknown"}).`);
        return;
    }
    recordOk(`Node.js ${process.versions.node}`);
}

function checkPixlet() {
    const result = spawnSync("pixlet", ["version"], { stdio: "pipe", encoding: "utf8" });
    if (result.error) { recordError("Pixlet CLI not found on PATH."); return; }
    if (result.status !== 0) {
        recordError(`Pixlet CLI check failed: ${(result.stderr || result.stdout || "").trim()}`);
        return;
    }
    const output = (result.stdout || "").trim();
    recordOk(output ? `Pixlet available (${output})` : "Pixlet available");
}

function checkConfig() {
    const hasEnvConfig = hasEnv("TIDBYT_DEVICE_ID") && hasEnv("TIDBYT_API_TOKEN");
    let hasLocalConfig = false;

    if (fs.existsSync(defaults.LOCAL_SETTINGS_PATH)) {
        try {
            const raw = JSON.parse(fs.readFileSync(defaults.LOCAL_SETTINGS_PATH, "utf8"));
            hasLocalConfig = Boolean(raw && raw.tidbyt_device_id && raw.tidbyt_api_token);
            if (!hasLocalConfig) {
                recordWarning("local-settings.json exists but is missing tidbyt_device_id or tidbyt_api_token.");
            }
        } catch (error) {
            recordError(`Failed to parse local-settings.json: ${error.message}`);
            return;
        }
    }

    if (!hasEnvConfig && !hasLocalConfig) {
        recordError("Missing Tidbyt credentials: set TIDBYT_DEVICE_ID + TIDBYT_API_TOKEN via env vars or local-settings.json.");
        recordError("Zone can be set later via the Roon extension settings UI.");
        return;
    }

    recordOk(hasEnvConfig ? "Tidbyt credentials found in environment" : "Tidbyt credentials found in local-settings.json");
}

function checkRuntimeDir() {
    const runtimeTmpPath = path.dirname(defaults.RENDER_OUTPUT_PATH);
    try {
        fs.mkdirSync(runtimeTmpPath, { recursive: true });
        fs.accessSync(runtimeTmpPath, fs.constants.W_OK);
        recordOk(`Writable runtime dir: ${runtimeTmpPath}`);
    } catch (error) {
        recordError(`Runtime dir is not writable (${runtimeTmpPath}): ${error.message}`);
    }
}

checkNode();
checkPixlet();
checkConfig();
checkRuntimeDir();

checks.forEach((line) => console.log(line));
warnings.forEach((line) => console.warn(line));
errors.forEach((line) => console.error(line));

if (errors.length) process.exit(1);
