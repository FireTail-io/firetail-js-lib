import fs from "fs";

import { Request, Response, NextFunction, RequestHandler } from "express";
import SwaggerParser from "@apidevtools/swagger-parser";
import middleware from "./services/middleware";

/* eslint-disable-next-line */
export interface FTNext extends NextFunction {}

export interface FTRequest extends Request {
    body: string | object;
    // TODO: type this properly once context object is stable
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    firetailContext?: { [key: string]: any };
}

export interface FTResponse extends Response {
    // TODO: type this properly once context object is stable
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    firetailContext?: { [key: string]: any };
}

export interface FiretailOptions {
    apiDocPath: string;
    firetailAPIKey?: string;
    firetailAPIHost?: string;
    apiSpec?: object;
    apiSpecPromise?: Promise<object>;
    operations?: { [operationId: string]: RequestHandler };
    securityHandlers?: {
        [securitySchema: string]: (
            request: FTRequest,
            scopes: object,
            securityDefinition: object
        ) => boolean;
    };
    sensitiveHeaders?: string[];
    accessResolvers?: {
        [resolverId: string]: (
            authenticatedPrincipal: string | number | object,
            authorisedPrincipal?: string | number | object,
            authorisedResource?:
                | string
                | number
                | object
                | string[]
                | number[]
                | object[]
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ) => boolean | Promise<any>;
    };
    identityResolvers?: {
        [resolverId: string]: (
            request: FTRequest | FTResponse
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ) => string | number | object | Promise<any>;
    };
    resourceResolvers?: {
        [resolverId: string]: (
            request: FTResponse
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ) => string | number | object | Promise<any>;
    };
}

export function firetail(options: FiretailOptions): RequestHandler {
    /**
     * Validate the OpenAPI file location
     */
    const apiDocPath = options.apiDocPath || process?.env?.API_DOC_PATH;

    if (!apiDocPath) {
        throw new Error("Mandatory option 'apiDocPath' is not specified");
    }
    if ("string" !== typeof apiDocPath) {
        throw new Error(
            `Option 'apiDocPath' is not a string: ${JSON.parse(
                apiDocPath ?? null
            )}`
        );
    }

    if (!fs.existsSync(apiDocPath)) {
        throw new Error("Can't locate YAML file");
    }

    /**
     * Parse the OpenAPI file
     */
    options.apiSpecPromise = SwaggerParser.validate(apiDocPath);
    options.apiSpecPromise
        .then(s => {
            options.apiSpec = s;
        })
        .catch(() => {
            throw new Error("Can't validate API doc");
        });

    return middleware(options);
}

export default firetail;
