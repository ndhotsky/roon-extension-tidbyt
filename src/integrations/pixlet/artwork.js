const state = require("../../state");

function fetchAlbumArtBase64(imageKey) {
    if (!imageKey || !state.runtime.image || !state.runtime.image.get_image) {
        return Promise.resolve("");
    }

    return new Promise((resolve) => {
        state.runtime.image.get_image(imageKey, (status, _contentType, body) => {
            if (status || !body) {
                if (status) console.warn("Roon image fetch failed for key %s: status %s", imageKey, status);
                resolve("");
                return;
            }
            try {
                const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, "binary");
                resolve(_toUrlSafeBase64(buf.toString("base64")));
            } catch (error) {
                console.warn("Failed to encode album art for key %s: %s", imageKey, error.message);
                resolve("");
            }
        });
    });
}

function _toUrlSafeBase64(value) {
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

module.exports = { fetchAlbumArtBase64 };
