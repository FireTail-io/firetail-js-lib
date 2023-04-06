"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function matchRequest(req, routes) {
    var _a;
    const match = routes.matchReq(req);
    const ctx = req.firetailContext;
    ctx.match = match;
    if (!match) {
        const error = {
            status: 404,
            type: "firetail.route.not.found",
            title: `No route available for path ${req.originalUrl}`,
        };
        ctx.observations.push(error);
        return {
            status: 404,
            error: error,
        };
    }
    if (!((_a = match.schema) === null || _a === void 0 ? void 0 : _a[ctx.method])) {
        const error = {
            status: 405,
            type: "firetail.method.not.found",
            title: `Method ${ctx.method} not available for path ${req.originalUrl}`,
        };
        ctx.observations.push(error);
        return {
            status: 405,
            error: error,
        };
    }
    return {};
}
exports.default = matchRequest;
//# sourceMappingURL=matchRequest.js.map