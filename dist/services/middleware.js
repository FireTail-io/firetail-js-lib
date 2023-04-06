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
const apiRoutes_1 = __importDefault(require("../services/apiRoutes"));
const getContext_1 = __importDefault(require("../services/getContext"));
const matchRequest_1 = __importDefault(require("../requestHandlers/matchRequest"));
const validateRequest_1 = __importDefault(require("../requestHandlers/validateRequest"));
const authenticateRequest_1 = __importDefault(require("../requestHandlers/authenticateRequest"));
const responseHandlers_1 = __importDefault(require("../responseHandlers"));
exports.default = options => {
    let routes;
    let apiSpec;
    const { apiSpecPromise } = options;
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        (0, responseHandlers_1.default)(res);
        const context = (0, getContext_1.default)(req, options);
        req.firetailContext = context;
        res.firetailContext = context;
        yield apiSpecPromise;
        try {
            if (!apiSpec) {
                apiSpec = options.apiSpec;
            }
            if (!routes) {
                routes = (0, apiRoutes_1.default)(apiSpec, context);
            }
            const match = (0, matchRequest_1.default)(req, routes);
            if (match.error) {
                context.intercepted = true;
                res.setHeader("content-type", "application/problem+json");
                return res.status(match.status).send(match.error);
            }
            const valid = (0, validateRequest_1.default)(req);
            if (valid.error) {
                context.intercepted = true;
                res.setHeader("content-type", "application/problem+json");
                return res.status(valid.status).send(valid.error);
            }
            const auth = yield (0, authenticateRequest_1.default)(req);
            if (auth.error) {
                context.intercepted = true;
                res.setHeader("content-type", "application/problem+json");
                return res.status(auth.status).send(auth.error);
            }
            return next();
        }
        catch (e) {
            const status = e.status || 500;
            const error = Object.assign({ status: status, type: "firetail.middleware.error", title: "Failed to handle request" }, e.error);
            context.observations.push(error);
            context.intercepted = true;
            res.setHeader("content-type", "application/problem+json");
            return res.status(status).send(error);
        }
    });
};
//# sourceMappingURL=middleware.js.map