const state = require("../../state");
const pushService = require("../../services/push-service");

function subscribeZones() {
    if (!state.runtime.transport) return;

    state.runtime.transport.subscribe_zones((response, msg) => {
        if (response === "Subscribed") {
            state.runtime.zonesById = {};
            (msg.zones || []).forEach((zone) => {
                state.runtime.zonesById[zone.zone_id] = zone;
            });
            _logKnownZones();
        } else if (response === "Changed") {
            (msg.zones_removed || []).forEach((zoneId) => {
                delete state.runtime.zonesById[zoneId];
            });
            (msg.zones_added || []).forEach((zone) => {
                state.runtime.zonesById[zone.zone_id] = zone;
            });
            (msg.zones_changed || []).forEach((zone) => {
                state.runtime.zonesById[zone.zone_id] = zone;
            });
            if ((msg.zones_removed && msg.zones_removed.length) || (msg.zones_added && msg.zones_added.length)) {
                _logKnownZones();
            }
            (msg.zones_seek_changed || []).forEach((zoneSeek) => {
                const zone = state.runtime.zonesById[zoneSeek.zone_id];
                if (!zone) return;
                zone.seek_position = zoneSeek.seek_position;
                zone.queue_time_remaining = zoneSeek.queue_time_remaining;
                if (zone.now_playing) zone.now_playing.seek_position = zoneSeek.seek_position;
            });
        } else if (response === "Unsubscribed") {
            state.runtime.zonesById = {};
        }

        pushService.maybeSchedulePush();
    });
}

function _logKnownZones() {
    const zones = Object.values(state.runtime.zonesById)
        .map((zone) => `${zone.display_name || zone.zone_id}: ${zone.zone_id}`)
        .sort();
    if (zones.length) console.log("Known zones:", zones.join(" | "));
}

module.exports = { subscribeZones };
