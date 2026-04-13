function sanitizeText(value) {
    const text = (value || "").replace(/\s+/g, " ").trim();
    return text.slice(0, 96);
}

/**
 * Locates a zone by zone_id or by output_id (as returned by the Roon zone picker).
 */
function findZone(zoneIdOrOutputId, zonesById) {
    if (!zoneIdOrOutputId) return null;
    const direct = zonesById[zoneIdOrOutputId];
    if (direct) return direct;
    for (const zone of Object.values(zonesById)) {
        if (!Array.isArray(zone.outputs)) continue;
        for (const output of zone.outputs) {
            if (output.output_id === zoneIdOrOutputId) return zone;
        }
    }
    return null;
}

function buildNowPlayingSnapshot(selectedZoneId, zonesById) {
    if (!selectedZoneId) {
        return { error: "Set a Roon Zone in extension settings, env, or local-settings.json", snapshot: null };
    }

    const zone = findZone(selectedZoneId, zonesById);
    if (!zone) {
        return { error: "Selected zone not currently available", snapshot: null };
    }

    const nowPlaying = zone.now_playing || {};
    const twoLine   = nowPlaying.two_line   || {};
    const threeLine = nowPlaying.three_line || {};
    const oneLine   = nowPlaying.one_line   || {};

    return {
        error: "",
        snapshot: {
            zoneId:   zone.zone_id,
            zoneName: sanitizeText(zone.display_name || ""),
            title:    sanitizeText(twoLine.line1 || threeLine.line1 || oneLine.line1 || zone.display_name || "Roon"),
            subtitle: sanitizeText(twoLine.line2 || threeLine.line2 || ""),
            album:    sanitizeText(threeLine.line3 || ""),
            imageKey: nowPlaying.image_key || "",
        },
    };
}

function snapshotToKey(snapshot) {
    return JSON.stringify(snapshot);
}

module.exports = { buildNowPlayingSnapshot, snapshotToKey };
