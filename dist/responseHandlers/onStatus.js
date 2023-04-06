"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function onStatus(responseMethod, res, args) {
    if (!res.firetailContext.originalStatusCode) {
        res.firetailContext.originalStatusCode = args[0];
    }
    return {};
}
exports.default = onStatus;
//# sourceMappingURL=onStatus.js.map