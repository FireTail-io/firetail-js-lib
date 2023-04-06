import { Request, Response, NextFunction, RequestHandler } from "express";
export interface FTNext extends NextFunction {
}
export interface FTRequest extends Request {
    body: string | object;
    firetailContext?: {
        [key: string]: any;
    };
}
export interface FTResponse extends Response {
    firetailContext?: {
        [key: string]: any;
    };
}
export interface FiretailOptions {
    apiDocPath: string;
    firetailAPIKey?: string;
    firetailAPIHost?: string;
    apiSpec?: object;
    apiSpecPromise?: Promise<object>;
    operations?: {
        [operationId: string]: RequestHandler;
    };
    securityHandlers?: {
        [securitySchema: string]: (request: FTRequest, scopes: object, securityDefinition: object) => boolean;
    };
    sensitiveHeaders?: string[];
    accessResolvers?: {
        [resolverId: string]: (authenticatedPrincipal: string | number | object, authorisedPrincipal?: string | number | object, authorisedResource?: string | number | object | string[] | number[] | object[]) => boolean | Promise<any>;
    };
    identityResolvers?: {
        [resolverId: string]: (request: FTRequest | FTResponse) => string | number | object | Promise<any>;
    };
    resourceResolvers?: {
        [resolverId: string]: (request: FTResponse) => string | number | object | Promise<any>;
    };
}
export declare function firetail(options: FiretailOptions): RequestHandler;
export default firetail;
