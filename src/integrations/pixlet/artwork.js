const state = require("../../state");

const ALBUM_ART_SIZE_PX = 24;
const MAX_ARTWORK_B64_LENGTH = 32000;
const ALBUM_ART_OPTIONS = {
    scale: "fill",
    width: ALBUM_ART_SIZE_PX,
    height: ALBUM_ART_SIZE_PX,
    format: "image/jpeg",
};

function fetchAlbumArtBase64(imageKey) {
    if (!imageKey || !state.runtime.image || !state.runtime.image.get_image) {
        return Promise.resolve("");
    }

    return new Promise((resolve) => {
        state.runtime.image.get_image(imageKey, ALBUM_ART_OPTIONS, (status, _contentType, body) => {
            if (status || !body) {
                if (status) console.warn("Roon image fetch failed for key %s: status %s", imageKey, status);
                resolve("");
                return;
            }
            try {
                const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, "binary");
                const encoded = buf.toString("base64url");
                if (encoded.length > MAX_ARTWORK_B64_LENGTH) {
                    console.warn(
                        "Skipping album art for key %s: encoded image is too large for Pixlet render args",
                        imageKey
                    );
                    resolve("");
                    return;
                }
                resolve(encoded);
            } catch (error) {
                console.warn("Failed to encode album art for key %s: %s", imageKey, error.message);
                resolve("");
            }
        });
    });
}

module.exports = { fetchAlbumArtBase64 };
