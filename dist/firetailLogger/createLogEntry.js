"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_ACTION_INFORMED = exports.LOG_ACTION_MODIFIED = exports.LOG_ACTION_BLOCKED = exports.VERSION = void 0;
const getSanitisedHeaders_1 = __importDefault(require("./getSanitisedHeaders"));
exports.VERSION = "1.0.0-alpha";
exports.LOG_ACTION_BLOCKED = "blocked";
exports.LOG_ACTION_MODIFIED = "modified";
exports.LOG_ACTION_INFORMED = "informed";
function createLogEntry(res) {
    var _a, _b, _c, _d, _e, _f, _g;
    const ctx = res.firetailContext;
    const req = res.req;
    let logAction = exports.LOG_ACTION_INFORMED;
    if (ctx.responseSanitised &&
        ctx.originalResponseBody !== ctx.responseBody) {
        logAction = exports.LOG_ACTION_MODIFIED;
    }
    if (ctx.intercepted) {
        logAction = exports.LOG_ACTION_BLOCKED;
    }
    const executionTime = ctx.finishedAt - ctx.startedAt;
    const nodeName = process.release.name;
    const nodeVersion = process.version ||
        process.versions.node ||
        ((_c = (_b = (_a = process.release.libUrl) === null || _a === void 0 ? void 0 : _a.match) === null || _b === void 0 ? void 0 : _b.call(_a, /\/release\/([^/]*)/)) === null || _c === void 0 ? void 0 : _c[0]);
    const urlObject = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
    const ip = req.get("x-forwarded-for") || ((_d = req.socket) === null || _d === void 0 ? void 0 : _d.remoteAddress);
    const { requestHeaders, responseHeaders } = (0, getSanitisedHeaders_1.default)(res);
    const observations = ctx.observations.map(o => ({
        type: o.type,
        title: o.title,
        status: o.status,
        details: typeof o.details === "string"
            ? o.details
            : JSON.stringify(o.details),
    }));
    return JSON.stringify({
        version: exports.VERSION,
        logAction: logAction,
        dateCreated: Date.now(),
        executionTime: executionTime,
        request: {
            httpProtocol: `HTTP/${req.httpVersion}`,
            uri: urlObject.toString(),
            resource: ctx.match.openAPIPath,
            headers: requestHeaders,
            method: ctx.method.toUpperCase(),
            body: JSON.stringify(req.body) || "",
            ip: ip,
        },
        response: {
            statusCode: res.statusCode,
            originalStatusCode: ctx.originalStatusCode,
            body: ctx.responseBody || "",
            originalBody: ctx.originalResponseBody || "",
            headers: responseHeaders,
        },
        metadata: {
            libraryVersion: "0.5.2",
            softwareVersion: `${nodeName} ${nodeVersion}`,
            hostname: req.hostname,
            localPort: (_g = (_f = (_e = req.get("host")) === null || _e === void 0 ? void 0 : _e.split) === null || _f === void 0 ? void 0 : _f.call(_e, ":")) === null || _g === void 0 ? void 0 : _g[1],
        },
        observations: observations,
    });
}
exports.default = createLogEntry;
//# sourceMappingURL=createLogEntry.js.map