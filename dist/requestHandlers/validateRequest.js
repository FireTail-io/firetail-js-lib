"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const type_is_1 = __importDefault(require("type-is"));
function validateRequest(req) {
    const ctx = req.firetailContext;
    const contentType = req.get("content-type");
    if (contentType && !type_is_1.default.match(contentType, "application/json")) {
        const error = {
            status: 415,
            type: "firetail.unsupported.request.content.type",
            title: "Unsupported content type",
            details: {
                contentType: contentType,
            },
        };
        ctx.observations.push(error);
        return {
            status: 415,
            error: error,
        };
    }
    const validator = ctx.match.requestValidators[ctx.method];
    if (typeof (validator === null || validator === void 0 ? void 0 : validator.validateRequest) !== "function") {
        ctx.observations.push({
            type: "firetail.request.validator.missing",
            title: "Request validator is missing",
            details: {
                path: ctx.path,
                method: ctx.method,
            },
        });
        return {};
    }
    const validatorErrors = validator.validateRequest(req);
    ctx.requestValidated = true;
    if (validatorErrors) {
        const error = {
            status: validatorErrors.status,
            type: "firetail.request.validation.failed",
            title: "Failed to validate request",
            details: validatorErrors,
        };
        ctx.observations.push(error);
        return {
            status: validatorErrors.status,
            error: error,
        };
    }
    return {};
}
exports.default = validateRequest;
//# sourceMappingURL=validateRequest.js.map