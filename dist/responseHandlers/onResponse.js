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
const type_is_1 = __importDefault(require("type-is"));
const map_1 = __importDefault(require("lodash/map"));
const trim_1 = __importDefault(require("lodash/trim"));
const split_1 = __importDefault(require("lodash/split"));
function onResponse(responseMethod, res, args) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const ctx = res.firetailContext;
        const code = res.statusCode;
        const match = ctx.match;
        const method = ctx.method;
        const responseBody = args[0];
        ctx.responseBody =
            typeof responseBody !== "string"
                ? JSON.stringify(responseBody)
                : responseBody;
        if (!ctx.originalResponseBody) {
            ctx.originalResponseBody =
                typeof responseBody !== "string"
                    ? JSON.stringify(responseBody)
                    : responseBody;
        }
        if (ctx.intercepted) {
            return {};
        }
        const accept = res.req.get("accept");
        if (!accept) {
            ctx.observations.push({
                type: "firetail.request.accept.header.missing",
                title: "The Accept header is missing from the request",
            });
        }
        const acceptArray = (0, map_1.default)((0, split_1.default)(accept, ","), trim_1.default);
        const contentType = res.get("content-type");
        if (contentType && accept && !type_is_1.default.is(contentType, acceptArray)) {
            const error = {
                status: 406,
                type: "firetail.incorrect.response.content.type",
                title: "Incorrect response format",
                details: {
                    message: `Response content type ${contentType} not found in Accept header: ${accept}`,
                    accept: accept,
                    contentType: contentType,
                },
            };
            ctx.observations.push(error);
            return {
                status: 406,
                error: error,
            };
        }
        const sanitizer = (_b = (_a = match === null || match === void 0 ? void 0 : match.responseSanitisers) === null || _a === void 0 ? void 0 : _a[method]) === null || _b === void 0 ? void 0 : _b[code];
        if (match && sanitizer && !ctx.responseSanitised) {
            ctx.responseSanitised = true;
            const valid = sanitizer === null || sanitizer === void 0 ? void 0 : sanitizer(responseBody);
            if (!valid) {
                const error = {
                    status: 500,
                    type: "firetail.response.sanitisation.failed",
                    title: "Failed to sanitise response",
                    details: sanitizer === null || sanitizer === void 0 ? void 0 : sanitizer.errors,
                };
                ctx.observations.push(error);
                return {
                    status: 500,
                    error: error,
                };
            }
        }
        if (match && !ctx.responseValidated) {
            ctx.responseValidated = true;
            const validator = match.responseValidators[method];
            const errors = validator.validateResponse(code, responseBody);
            if (errors) {
                const error = {
                    status: 500,
                    type: "firetail.response.validation.failed",
                    title: "Failed to validate response",
                    details: errors,
                };
                ctx.observations.push(error);
                return {
                    status: 500,
                    error: error,
                };
            }
        }
        return {};
    });
}
exports.default = onResponse;
//# sourceMappingURL=onResponse.js.map