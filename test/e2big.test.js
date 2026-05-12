const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const defaults = require("../src/config/defaults");
const state = require("../src/state");
const artwork = require("../src/integrations/pixlet/artwork");
const renderer = require("../src/integrations/pixlet/renderer");
const pushService = require("../src/services/push-service");

const ORIGINAL_PATH = process.env.PATH || "";
const ROON_RESIZE_OPTIONS = {
    scale: "fill",
    width: 24,
    height: 24,
    format: "image/jpeg",
};

function resetState() {
    if (state.runtime.debounceTimer) {
        clearTimeout(state.runtime.debounceTimer);
    }

    Object.assign(state.settingsState, {
        tidbyt_device_id: "",
        tidbyt_api_token: "",
        zone_id: "",
        zone: null,
        debounce_ms: defaults.DEFAULT_DEBOUNCE_MS,
        min_push_interval_sec: defaults.DEFAULT_MIN_PUSH_INTERVAL_SEC,
    });

    Object.assign(state.runtime, {
        transport: null,
        image: null,
        zonesById: {},
        debounceTimer: null,
        lastSnapshotKey: "",
        pendingSnapshot: null,
        pushInFlight: false,
        lastPushAtMs: 0,
        lastStatusMessage: "",
        lastStatusIsError: null,
        pixletAvailable: false,
    });

    process.env.PATH = ORIGINAL_PATH;
    delete process.env.FAKE_PIXLET_LOG;
    delete process.env.FAKE_PIXLET_MAX_ARG_LENGTH;
}

function withMockedWarn(fn) {
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => { warnings.push(args.join(" ")); };

    return Promise.resolve()
        .then(() => fn(warnings))
        .finally(() => { console.warn = originalWarn; });
}

function installFakePixlet(t, options = {}) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "roon-tidbyt-pixlet-"));
    const logPath = path.join(tmpDir, "pixlet-invocations.jsonl");
    const pixletPath = path.join(tmpDir, "pixlet");

    fs.writeFileSync(pixletPath, `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const maxArgLength = Number(process.env.FAKE_PIXLET_MAX_ARG_LENGTH || "131071");
for (const arg of args) {
    if (arg.length > maxArgLength) {
        console.error("argument too large: " + arg.slice(0, 32) + " length=" + arg.length);
        process.exit(7);
    }
}

fs.appendFileSync(process.env.FAKE_PIXLET_LOG, JSON.stringify({ args }) + "\\n");

if (args[0] === "render") {
    const outputIndex = args.indexOf("--output");
    if (outputIndex === -1 || !args[outputIndex + 1]) {
        console.error("missing render output path");
        process.exit(2);
    }
    fs.mkdirSync(path.dirname(args[outputIndex + 1]), { recursive: true });
    fs.writeFileSync(args[outputIndex + 1], "fake-webp");
}
`, "utf8");
    fs.chmodSync(pixletPath, 0o755);

    process.env.PATH = tmpDir + path.delimiter + ORIGINAL_PATH;
    process.env.FAKE_PIXLET_LOG = logPath;
    process.env.FAKE_PIXLET_MAX_ARG_LENGTH = String(options.maxArgLength || 131071);

    t.after(() => {
        process.env.PATH = ORIGINAL_PATH;
        delete process.env.FAKE_PIXLET_LOG;
        delete process.env.FAKE_PIXLET_MAX_ARG_LENGTH;
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    return logPath;
}

function readFakePixletLog(logPath) {
    return fs.readFileSync(logPath, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}

function waitFor(predicate, timeoutMs = 5000) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        function check() {
            if (predicate()) {
                resolve();
                return;
            }

            if (Date.now() - startedAt > timeoutMs) {
                reject(new Error("Timed out waiting for condition"));
                return;
            }

            setTimeout(check, 10);
        }

        check();
    });
}

test("requests display-sized album art from Roon before encoding", async (t) => {
    resetState();
    t.after(resetState);

    let observedCall = null;
    state.runtime.image = {
        get_image(imageKey, options, callback) {
            observedCall = { imageKey, options };
            callback(false, "image/jpeg", Buffer.from("abc"));
        },
    };

    const encoded = await artwork.fetchAlbumArtBase64("roon-image-key");

    assert.equal(encoded, "YWJj");
    assert.deepEqual(observedCall, {
        imageKey: "roon-image-key",
        options: ROON_RESIZE_OPTIONS,
    });
});

test("skips artwork when Roon still returns an oversized image", async (t) => {
    resetState();
    t.after(resetState);

    let observedOptions = null;
    state.runtime.image = {
        get_image(_imageKey, options, callback) {
            observedOptions = options;
            callback(false, "image/jpeg", Buffer.alloc(25000, 1));
        },
    };

    await withMockedWarn(async (warnings) => {
        const encoded = await artwork.fetchAlbumArtBase64("oversized-image-key");

        assert.equal(encoded, "");
        assert.deepEqual(observedOptions, ROON_RESIZE_OPTIONS);
        assert.match(warnings.join("\n"), /encoded image is too large/);
    });
});

test("fake Pixlet harness rejects oversized render arguments", async (t) => {
    resetState();
    t.after(resetState);

    installFakePixlet(t, { maxArgLength: 32012 });
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "roon-tidbyt-render-"));
    t.after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

    await assert.rejects(
        renderer.renderAndPush({
            snapshot: {
                title: "Oversized Art Track",
                subtitle: "Test Artist",
                album: "Test Album",
                zoneName: "Living Room",
                artworkB64: "x".repeat(33000),
            },
            settingsState: {
                tidbyt_device_id: "tidbyt-device",
                tidbyt_api_token: "tidbyt-token",
            },
            pixletPath: defaults.PIXLET_APP_PATH,
            renderOutputPath: path.join(tmpDir, "out.webp"),
            workingDirectory: defaults.PROJECT_ROOT,
        }),
        /argument too large/
    );
});

test("push pipeline renders and pushes when mocked Roon artwork is too large for Pixlet args", async (t) => {
    resetState();
    t.after(resetState);

    const logPath = installFakePixlet(t, { maxArgLength: 32012 });
    const oversizedArtwork = Buffer.alloc(25000, 1);

    state.settingsState.tidbyt_device_id = "tidbyt-device";
    state.settingsState.tidbyt_api_token = "tidbyt-token";
    state.settingsState.zone_id = "zone-1";
    state.settingsState.debounce_ms = 1;
    state.settingsState.min_push_interval_sec = 0;
    state.runtime.pixletAvailable = true;
    state.runtime.image = {
        get_image(imageKey, options, callback) {
            assert.equal(imageKey, "oversized-artwork");
            assert.deepEqual(options, ROON_RESIZE_OPTIONS);
            callback(false, "image/jpeg", oversizedArtwork);
        },
    };
    state.runtime.zonesById = {
        "zone-1": {
            zone_id: "zone-1",
            display_name: "Living Room",
            now_playing: {
                image_key: "oversized-artwork",
                two_line: {
                    line1: "Oversized Art Track",
                    line2: "Test Artist",
                },
                three_line: {
                    line1: "Oversized Art Track",
                    line2: "Test Artist",
                    line3: "Test Album",
                },
            },
        },
    };

    fs.mkdirSync(path.dirname(defaults.RENDER_OUTPUT_PATH), { recursive: true });

    await withMockedWarn(async () => {
        pushService.maybeSchedulePush();
        await waitFor(() => state.runtime.lastStatusMessage === "Last push succeeded");
    });

    assert.equal(state.runtime.lastStatusIsError, false);

    const invocations = readFakePixletLog(logPath);
    assert.equal(invocations.length, 2);

    const renderArgs = invocations[0].args;
    assert.equal(renderArgs[0], "render");
    assert.ok(renderArgs.includes("artwork_b64="));
    assert.ok(renderArgs.every((arg) => arg.length <= 32012));

    const pushArgs = invocations[1].args;
    assert.deepEqual(pushArgs, [
        "push",
        "tidbyt-device",
        defaults.RENDER_OUTPUT_PATH,
        "--api-token",
        "tidbyt-token",
        "--installation-id",
        defaults.DEFAULT_INSTALLATION_ID,
    ]);
});
