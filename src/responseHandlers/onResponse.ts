/* eslint-disable max-len */

import typeis from "type-is";
import map from "lodash/map";
import trim from "lodash/trim";
import split from "lodash/split";

export default async function onResponse(responseMethod, res, args) {
    const ctx = res.firetailContext;
    const code = res.statusCode;
    const match = ctx.match;
    const method = ctx.method;
    const responseBody = args[0];

    /**
     * Every time we pass through we update our copy of the most recent response
     * body.
     */
    ctx.responseBody =
        typeof responseBody !== "string"
            ? JSON.stringify(responseBody)
            : responseBody;

    /**
     * The first time we pass through, we make a copy of the original response
     * body.
     */
    if (!ctx.originalResponseBody) {
        ctx.originalResponseBody =
            typeof responseBody !== "string"
                ? JSON.stringify(responseBody)
                : responseBody;
    }

    /**
     * If we are dealing with a response that has already been intercepted, we
     * can exit early here.
     */
    if (ctx.intercepted) {
        return {};
    }

    /**
     * Validate content type using type-is, which is the default express type
     * validator.
     *
     * NOTE: even though this is technically a server issue, it is a 4xx code.
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406
     */
    const accept = res.req.get("accept");
    if (!accept) {
        ctx.observations.push({
            type: "firetail.request.accept.header.missing",
            title: "The Accept header is missing from the request",
        });
    }
    const acceptArray = map(split(accept, ","), trim);
    const contentType = res.get("content-type");
    if (contentType && accept && !typeis.is(contentType, acceptArray)) {
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

    /**
     * Response sanitisation
     *
     * We use the Ajv JSON schema validator (the same one the open-api
     * project uses) to modify the response.
     *
     * NOTE: the order here is important. We want to do this before response
     * validation.
     */
    const sanitizer = match?.responseSanitisers?.[method]?.[code];
    if (match && sanitizer && !ctx.responseSanitised) {
        ctx.responseSanitised = true;
        const valid = sanitizer?.(responseBody);
        if (!valid) {
            const error = {
                status: 500,
                type: "firetail.response.sanitisation.failed",
                title: "Failed to sanitise response",
                details: sanitizer?.errors,
            };
            ctx.observations.push(error);
            return {
                status: 500,
                error: error,
            };
        }
    }

    /**
     * Response validation
     *
     * express-openapi provides the exact same validator in res.validateResponse
     * we should just put a thin wrapper around express-openapi
     */
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
}
