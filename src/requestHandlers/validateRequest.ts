import typeis from "type-is";

export default function validateRequest(req) {
    /**
     * Request validation
     */
    const ctx = req.firetailContext;
    const contentType = req.get("content-type");
    // TODO: Add more allowed types, e.g. based on provided custom body decoders
    if (contentType && !typeis.match(contentType, "application/json")) {
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
    if (typeof validator?.validateRequest !== "function") {
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
