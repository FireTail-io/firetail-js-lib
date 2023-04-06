"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLEAN = void 0;
const map_1 = __importDefault(require("lodash/map"));
const find_1 = __importDefault(require("lodash/find"));
const forEach_1 = __importDefault(require("lodash/forEach"));
const toLower_1 = __importDefault(require("lodash/toLower"));
const compact_1 = __importDefault(require("lodash/compact"));
const flattenDeep_1 = __importDefault(require("lodash/flattenDeep"));
exports.CLEAN = "*****";
function getSanitisedHeaders(res) {
    var _a, _b, _c, _d, _e;
    const ctx = res.firetailContext;
    const schema = (_b = (_a = ctx.match) === null || _a === void 0 ? void 0 : _a.schema) === null || _b === void 0 ? void 0 : _b[ctx.method];
    const hiddenRequestHeaders = ["authorization", "proxy-authorization"];
    const hiddenResponseHeaders = ["www-authenticate", "proxy-authenticate"];
    const headersFromConfig = ctx.sensitiveHeaders;
    if (headersFromConfig === null || headersFromConfig === void 0 ? void 0 : headersFromConfig.length) {
        hiddenRequestHeaders.push(...headersFromConfig);
        hiddenResponseHeaders.push(...headersFromConfig);
    }
    const headersFromSchema = schema === null || schema === void 0 ? void 0 : schema["x-ft-sensitive-headers"];
    if (headersFromSchema === null || headersFromSchema === void 0 ? void 0 : headersFromSchema.length) {
        hiddenRequestHeaders.push(...headersFromSchema);
        hiddenResponseHeaders.push(...headersFromSchema);
    }
    const schemes = (0, flattenDeep_1.default)((_e = (_d = (_c = ctx.match) === null || _c === void 0 ? void 0 : _c.securityHandlers) === null || _d === void 0 ? void 0 : _d[ctx.method]) === null || _e === void 0 ? void 0 : _e.securitySets);
    const headersFromSecurity = (0, compact_1.default)((0, map_1.default)(schemes, s => {
        var _a;
        return ((_a = s.definition) === null || _a === void 0 ? void 0 : _a.in) === "header" ? s.definition.name : null;
    }));
    if (headersFromSecurity === null || headersFromSecurity === void 0 ? void 0 : headersFromSecurity.length) {
        hiddenRequestHeaders.push(...headersFromSecurity);
        hiddenResponseHeaders.push(...headersFromSecurity);
    }
    const requestHeaders = {};
    const responseHeaders = {};
    (0, forEach_1.default)(res.req.headers, (value, key) => {
        if (!requestHeaders[key]) {
            requestHeaders[key] = [];
        }
        let clean = exports.CLEAN;
        if (!(0, find_1.default)(hiddenRequestHeaders, h => (0, toLower_1.default)(key) === (0, toLower_1.default)(h))) {
            clean = value;
        }
        requestHeaders[key].push(clean);
    });
    (0, forEach_1.default)(res.getHeaders(), (value, key) => {
        if (!responseHeaders[key]) {
            responseHeaders[key] = [];
        }
        let clean = exports.CLEAN;
        if (!(0, find_1.default)(hiddenResponseHeaders, h => (0, toLower_1.default)(key) === (0, toLower_1.default)(h))) {
            clean = value;
        }
        responseHeaders[key].push(clean);
    });
    return {
        requestHeaders,
        responseHeaders,
    };
}
exports.default = getSanitisedHeaders;
//# sourceMappingURL=getSanitisedHeaders.js.map