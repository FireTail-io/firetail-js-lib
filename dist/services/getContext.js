"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getContext(req, options) {
    var _a;
    return Object.assign(Object.assign({}, options), { startedAt: Date.now(), finishedAt: 0, method: req.method.toLowerCase(), path: ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.originalUrl, responseBody: null, originalStatusCode: null, originalResponseBody: null, observations: [], match: null, logged: false, intercepted: false, authenticated: false, requestValidated: false, responseValidated: false, responseSanitised: false, responseAuthorized: false, authenticatedPrincipal: null });
}
exports.default = getContext;
//# sourceMappingURL=getContext.js.map