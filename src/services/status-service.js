const state = require("../state");

let _svcStatus = null;

function init(svcStatus) {
    _svcStatus = svcStatus;
}

function update(message, isError) {
    const errorFlag = Boolean(isError);
    if (state.runtime.lastStatusMessage === message && state.runtime.lastStatusIsError === errorFlag) return;
    state.runtime.lastStatusMessage = message;
    state.runtime.lastStatusIsError = errorFlag;
    if (_svcStatus) _svcStatus.set_status(message, errorFlag);
}

module.exports = { init, update };
