"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingResponseSanitisers = exports.missingResponseValidators = exports.missingRequestValidators = exports.missingSecurityHandlers = exports._ajv = void 0;
const forEach_1 = __importDefault(require("lodash/forEach"));
const openapi_security_handler_1 = __importDefault(require("openapi-security-handler"));
const openapi_request_validator_1 = __importDefault(require("openapi-request-validator"));
const openapi_response_validator_1 = __importDefault(require("openapi-response-validator"));
const ajv_1 = __importDefault(require("ajv"));
exports._ajv = new ajv_1.default({
    strict: false,
    validateFormats: false,
    removeAdditional: true,
});
const pathPatterns = {};
exports.missingSecurityHandlers = [];
exports.missingRequestValidators = [];
exports.missingResponseValidators = [];
exports.missingResponseSanitisers = [];
exports.default = (apiSpec, ctx) => {
    (0, forEach_1.default)(apiSpec === null || apiSpec === void 0 ? void 0 : apiSpec.paths, (schema, openAPIPath) => {
        const path = openAPIPath.replace(/\{([^}]+)}/g, ":$1");
        const securityHandlers = {};
        const requestValidators = {};
        const responseValidators = {};
        const responseSanitisers = {};
        (0, forEach_1.default)(schema, (s, method) => {
            let securityHandler;
            try {
                securityHandler = new openapi_security_handler_1.default({
                    securityDefinitions: apiSpec.components.securitySchemes,
                    securityHandlers: ctx.securityHandlers,
                    operationSecurity: s.security,
                    loggingKey: "FireTail Authentication Setup",
                });
            }
            catch (_a) {
                exports.missingSecurityHandlers.push({ path, method });
            }
            securityHandlers[method] = securityHandler;
            let requestValidator;
            try {
                requestValidator = new openapi_request_validator_1.default({
                    parameters: s.parameters,
                    requestBody: s.requestBody,
                    loggingKey: "FireTail Request Validation Setup",
                });
            }
            catch (_b) {
                exports.missingRequestValidators.push({ path, method });
            }
            requestValidators[method] = requestValidator;
            let responseValidator;
            try {
                responseValidator = new openapi_response_validator_1.default({
                    responses: s.responses,
                    loggingKey: "FireTail Response Validation Setup",
                });
            }
            catch (_c) {
                exports.missingResponseValidators.push({ path, method });
            }
            responseValidators[method] = responseValidator;
            responseSanitisers[method] = {};
            (0, forEach_1.default)(s.responses, (r, code) => {
                var _a, _b, _c;
                const rs = (_c = (_a = r.content) === null || _a === void 0 ? void 0 : _a[(_b = Object.keys(r.content)) === null || _b === void 0 ? void 0 : _b[0]]) === null || _c === void 0 ? void 0 : _c.schema;
                if (!rs || rs.additionalProperties !== false)
                    return;
                let responseSanitiser;
                try {
                    responseSanitiser = exports._ajv.compile(rs);
                }
                catch (_d) {
                    exports.missingResponseSanitisers.push({ path, method, code });
                }
                responseSanitisers[method][code] = responseSanitiser;
            });
        });
        pathPatterns[path] = {
            path,
            openAPIPath,
            schema,
            securityHandlers,
            requestValidators,
            responseValidators,
            responseSanitisers,
        };
    });
    return {
        matchReq: (req) => { var _a, _b; return pathPatterns[(_b = (_a = req.route) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : req.originalUrl]; },
    };
};
//# sourceMappingURL=apiRoutes.js.map