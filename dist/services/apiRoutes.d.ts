import OpenAPISecurityHandler from "openapi-security-handler";
import OpenAPIRequestValidator from "openapi-request-validator";
import OpenAPIResponseValidator from "openapi-response-validator";
import Ajv, { ValidateFunction } from "ajv";
import { FTRequest } from "../";
export declare const _ajv: Ajv;
export interface pathObject {
    path: string;
    openAPIPath: string;
    schema: object;
    securityHandlers: {
        [method: string]: OpenAPISecurityHandler;
    };
    requestValidators: {
        [method: string]: OpenAPIRequestValidator;
    };
    responseValidators: {
        [method: string]: OpenAPIResponseValidator;
    };
    responseSanitisers: {
        [method: string]: {
            [code: string]: ValidateFunction;
        };
    };
}
export declare const missingSecurityHandlers: any[];
export declare const missingRequestValidators: any[];
export declare const missingResponseValidators: any[];
export declare const missingResponseSanitisers: any[];
declare const _default: (apiSpec: any, ctx: any) => {
    matchReq: (req: FTRequest) => pathObject;
};
export default _default;
