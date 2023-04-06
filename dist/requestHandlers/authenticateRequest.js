"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_1 = __importDefault(require("lodash/get"));
function authenticateRequest(req) {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function* () {
        const ctx = req.firetailContext;
        const security = (_c = (_b = (_a = ctx.match) === null || _a === void 0 ? void 0 : _a.schema) === null || _b === void 0 ? void 0 : _b[ctx.method]) === null || _c === void 0 ? void 0 : _c["x-ft-security"];
        const handler = (_e = (_d = ctx.match) === null || _d === void 0 ? void 0 : _d.securityHandlers) === null || _e === void 0 ? void 0 : _e[ctx.method];
        if (!handler) {
            ctx.observations.push({
                status: 500,
                type: "firetail.security.handler.missing",
                title: "Missing security handler",
                details: { path: ctx.path, method: ctx.method },
            });
        }
        else {
            try {
                yield ((_f = handler.handle) === null || _f === void 0 ? void 0 : _f.call(handler, req));
                ctx.authenticated = true;
            }
            catch (e) {
                const error = {
                    status: e.status,
                    type: "firetail.request.authentication.failed",
                    title: "Failed to validate request",
                    details: e,
                };
                ctx.observations.push(error);
                return {
                    status: e.status,
                    error: error,
                };
            }
        }
        const path = security === null || security === void 0 ? void 0 : security["authenticated-principal-path"];
        const resolverId = security === null || security === void 0 ? void 0 : security["authenticated-principal-resolver"];
        const resolver = (_g = ctx.identityResolvers) === null || _g === void 0 ? void 0 : _g[resolverId];
        if (resolverId && typeof resolver !== "function") {
            const error = {
                status: 500,
                type: "firetail.authentication.identity.resolver.missing",
                title: "Could not find the defined identity resolver",
                details: {
                    resolverId,
                },
            };
            ctx.observations.push(error);
            return {
                status: 500,
                error: error,
            };
        }
        let principal;
        if (path) {
            principal = (0, get_1.default)(req, path);
        }
        else if (typeof resolver === "function") {
            principal = yield resolver(req);
        }
        if (!principal) {
            const error = {
                status: 500,
                type: "firetail.authenticated.principal.not.defined",
                title: "No authenticated principal defined",
                details: {
                    path: ctx.path,
                    method: ctx.method,
                },
            };
            ctx.observations.push(error);
        }
        ctx.authenticatedPrincipal = principal;
        return {};
    });
}
exports.default = authenticateRequest;
//# sourceMappingURL=authenticateRequest.js.map