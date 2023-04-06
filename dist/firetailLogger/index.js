"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._logConfig = exports._flushLogBuffer = exports.MIN_MAX_TIME_MS = exports.MIN_MAX_ITEMS = exports.MIN_MAX_SIZE = exports.BYTES_PER_UTF16 = void 0;
const os_1 = require("os");
const node_fetch_1 = __importDefault(require("node-fetch"));
const sumBy_1 = __importDefault(require("lodash/sumBy"));
const createLogEntry_1 = __importDefault(require("./createLogEntry"));
const stream_1 = __importDefault(require("stream"));
const logBuffer = [];
let logSize = 0;
let logIntervalId;
exports.BYTES_PER_UTF16 = 4;
exports.MIN_MAX_SIZE = 100000;
exports.MIN_MAX_ITEMS = 100;
exports.MIN_MAX_TIME_MS = 1000;
let LOG_MAX_SIZE = 950000;
let LOG_MAX_ITEMS = 1000;
let LOG_MAX_TIME_MS = 5 * 1000;
let API_KEY;
let API_ENDPOINT;
function logResponse(res) {
    const ctx = res.firetailContext;
    if (!API_KEY || API_KEY !== (ctx === null || ctx === void 0 ? void 0 : ctx.firetailAPIKey)) {
        API_KEY = ctx === null || ctx === void 0 ? void 0 : ctx.firetailAPIKey;
        if (!API_KEY) {
            throw new Error(JSON.stringify({
                type: "firetail.logger.api.key.missing",
                title: "Missing API key.",
            }));
        }
    }
    if (!API_ENDPOINT || API_ENDPOINT !== (ctx === null || ctx === void 0 ? void 0 : ctx.firetailAPIHost)) {
        let url;
        try {
            url = new URL(`${ctx === null || ctx === void 0 ? void 0 : ctx.firetailAPIHost}/logs/bulk`);
        }
        catch (error) {
            throw new Error(JSON.stringify({
                type: "firetail.logger.api.endpoint.incorrect",
                title: "Failed to construct the API endpoint URL.",
                details: {
                    error,
                },
            }));
        }
        API_ENDPOINT = url.toString();
    }
    if (!logIntervalId) {
        logIntervalId = setInterval(() => {
            if (!logBuffer.length)
                return;
            (0, exports._flushLogBuffer)();
        }, LOG_MAX_TIME_MS);
    }
    const entry = (0, createLogEntry_1.default)(res);
    logSize += entry.length * exports.BYTES_PER_UTF16;
    if (logSize >= LOG_MAX_SIZE)
        (0, exports._flushLogBuffer)();
    logBuffer.push(entry);
    if (logBuffer.length >= LOG_MAX_ITEMS)
        (0, exports._flushLogBuffer)();
}
exports.default = logResponse;
const _flushLogBuffer = () => {
    const stream = new stream_1.default.Readable();
    (0, node_fetch_1.default)(API_ENDPOINT, {
        method: "POST",
        headers: {
            "content-type": "application/x-ndjson",
            "x-ft-api-key": API_KEY,
        },
        body: stream,
    })
        .then(() => console.log("Logs flushed"))
        .catch(e => console.log("Error flushing logs ", e));
    while (logBuffer.length)
        stream.push(logBuffer.shift() + os_1.EOL);
    stream.push(null);
    logSize = (0, sumBy_1.default)(logBuffer, "length");
};
exports._flushLogBuffer = _flushLogBuffer;
function _logConfig(key, value) {
    switch (key) {
        case "LOG_MAX_SIZE":
            LOG_MAX_SIZE = Math.max(value, exports.MIN_MAX_SIZE);
            break;
        case "LOG_MAX_ITEMS":
            LOG_MAX_ITEMS = Math.max(value, exports.MIN_MAX_ITEMS);
            break;
        case "LOG_MAX_TIME_MS":
            LOG_MAX_TIME_MS = Math.max(value, exports.MIN_MAX_TIME_MS);
            if (logIntervalId) {
                clearInterval(logIntervalId);
                logIntervalId = setInterval(() => {
                    if (!logBuffer.length)
                        return;
                    (0, exports._flushLogBuffer)();
                }, LOG_MAX_TIME_MS);
            }
            break;
    }
}
exports._logConfig = _logConfig;
//# sourceMappingURL=index.js.map