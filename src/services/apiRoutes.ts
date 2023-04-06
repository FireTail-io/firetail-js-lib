/**
 * This module provides a route matching function that will match
 * requests to OpenAPI paths.
 */
import forEach from "lodash/forEach";
import OpenAPISecurityHandler from "openapi-security-handler";
import OpenAPIRequestValidator from "openapi-request-validator";
import OpenAPIResponseValidator from "openapi-response-validator";

import Ajv, { ValidateFunction } from "ajv";

import { FTRequest } from "../";

/* Exported for testing */
export const _ajv = new Ajv({
    strict: false,
    validateFormats: false,
    removeAdditional: true,
});

export interface pathObject {
    path: string;
    openAPIPath: string;
    schema: object;
    securityHandlers: { [method: string]: OpenAPISecurityHandler };
    requestValidators: { [method: string]: OpenAPIRequestValidator };
    responseValidators: { [method: string]: OpenAPIResponseValidator };
    responseSanitisers: {
        [method: string]: { [code: string]: ValidateFunction };
    };
}

const pathPatterns: { [path: string]: pathObject } = {};

/**
 * These arrays collect information about misconfigured API routes. The findings
 * should be logged to the SaaS platform somehow and attached to the API.
 */
export const missingSecurityHandlers = [];
export const missingRequestValidators = [];
export const missingResponseValidators = [];
export const missingResponseSanitisers = [];

/**
 * This is the function that ingests an OpenAPI spec and application context
 * and returns an object containing a function to match express request to a
 * defined OpenAPI route + additional info.
 */
export default (apiSpec, ctx) => {
    forEach(apiSpec?.paths, (schema, openAPIPath) => {
        /**
         * OpenAPI spec identifies named path parameters by enclosing {}
         * e.g. /resource/{id}, express denotes these by prepending a ":"
         *
         * This is the exact function that express-openapi uses to transform
         * the paths
         */ /* eslint-disable-next-line */ /*
         * https://github.com/kogosoftwarellc/open-api/blob/f5eb28e5a12b110d5ccdf8bcbcb8c66bb13146e8/packages/express-openapi/index.ts#L254
         */
        const path = openAPIPath.replace(/\{([^}]+)}/g, ":$1");
        /**
         * Construct OpenAPI security handlers and validators for each
         * method on "path" based on the API spec for this particular
         * route.
         *
         * This will throw if API doc is invalid
         */
        const securityHandlers = {};
        const requestValidators = {};
        const responseValidators = {};
        const responseSanitisers = {};
        forEach(schema, (s, method) => {
            let securityHandler;
            try {
                securityHandler = new OpenAPISecurityHandler({
                    securityDefinitions: apiSpec.components.securitySchemes,
                    securityHandlers: ctx.securityHandlers,
                    operationSecurity: s.security,
                    loggingKey: "FireTail Authentication Setup",
                });
            } catch {
                missingSecurityHandlers.push({ path, method });
            }
            securityHandlers[method] = securityHandler;

            let requestValidator;
            try {
                requestValidator = new OpenAPIRequestValidator({
                    parameters: s.parameters,
                    requestBody: s.requestBody,
                    loggingKey: "FireTail Request Validation Setup",
                });
            } catch {
                missingRequestValidators.push({ path, method });
            }
            requestValidators[method] = requestValidator;

            let responseValidator;
            try {
                responseValidator = new OpenAPIResponseValidator({
                    responses: s.responses,
                    loggingKey: "FireTail Response Validation Setup",
                });
            } catch {
                missingResponseValidators.push({ path, method });
            }
            responseValidators[method] = responseValidator;

            responseSanitisers[method] = {};
            forEach(s.responses, (r, code) => {
                /**
                 * Response schemas are keyed by <content_type>. We just take
                 * the first one (this is how OpenAPIResponseValidator does it
                 * too).
                 *
                 * We only prepare a sanitiser if the response schema is
                 * documented and the schema has additionalProperties = false;
                 *
                 * TODO: should we differentiate by content type? How common is
                 * it for endpoints to be polymorphic in that way?
                 */
                const rs = r.content?.[Object.keys(r.content)?.[0]]?.schema;
                if (!rs || rs.additionalProperties !== false) return;
                let responseSanitiser;
                try {
                    responseSanitiser = _ajv.compile(rs);
                } catch {
                    missingResponseSanitisers.push({ path, method, code });
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
        matchReq: (req: FTRequest): pathObject =>
            pathPatterns[req.route?.path ?? req.originalUrl],
    };
};
