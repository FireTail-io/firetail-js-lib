/* eslint-disable-next-line */
// @ts-nocheck
import apiRoutes, {
    _ajv,
    missingSecurityHandlers,
    missingRequestValidators,
    missingResponseValidators,
    missingResponseSanitisers,
} from "../../src/services/apiRoutes";

import OpenAPISecurityHandler from "openapi-security-handler";
import OpenAPIRequestValidator from "openapi-request-validator";
import OpenAPIResponseValidator from "openapi-response-validator";

const STATUS = 200;
const BROKEN_STATUS = 201;
const CONTENT_TYPE = "application/json";

const SCHEMA = {
    additionalProperties: false,
    required: ["id"],
    properties: {
        id: {
            type: "integer",
            minimum: 5,
        },
    },
};

const THROW = "throw";

const RESPONSES = {
    [STATUS]: {
        content: {
            [CONTENT_TYPE]: {
                schema: SCHEMA,
            },
        },
    },
};
const BROKEN_RESPONSES = {
    [BROKEN_STATUS]: {
        content: {
            [CONTENT_TYPE]: {
                schema: {
                    additionalProperties: false,
                    [THROW]: "ThisIsNotASchema",
                },
            },
        },
    },
};

const REQUEST_BODY = {
    required: true,
    constent: {
        "application/json": {
            schema: SCHEMA,
        },
    },
};

const VALID_OAPI_PATH = "/foo/{id}";
const VALID_EXP_PATH = "/foo/:id";
const NO_SECURITY_PATH = "/bar";
const NO_RESPONSES_PATH = "/baz";
const BROKEN_REQUEST_PATH = "/qux";
const BROKEN_RESPONSE_PATH = "/fred";

const VALID_METHOD = "get";
const NO_AUTH_METHOD = "put";
const NO_SECURITY_METHOD = "post";
const NO_RESPONSES_METHOD = "patch";
const BROKEN_REQUEST_METHOD = "delete";
const BROKEN_RESPONSE_METHOD = "options";

const SECURITY_HANDLER_ID = "jwt";
const SECURITY_HANDLER_FN = jest.fn(() => true);

const SECURITY = [
    {
        [SECURITY_HANDLER_ID]: [],
    },
];
const NO_SECURITY = [{}];

const VALID_SCHEMA = {
    [VALID_METHOD]: {
        security: SECURITY,
        responses: RESPONSES,
    },
    [NO_AUTH_METHOD]: {
        security: NO_SECURITY,
        responses: RESPONSES,
    },
};
const NO_SECURITY_SCHEMA = {
    [NO_SECURITY_METHOD]: {
        responses: RESPONSES,
    },
};
const NO_RESPONSES_SCHEMA = {
    [NO_RESPONSES_METHOD]: {
        security: SECURITY,
    },
};
const BROKEN_REQUEST_SCHEMA = {
    [BROKEN_REQUEST_METHOD]: {
        security: SECURITY,
        responses: RESPONSES,
        requestBody: REQUEST_BODY,
        parameters: "TheseAreNotParameters",
    },
};
const BROKEN_RESPONSE_SCHEMA = {
    [BROKEN_RESPONSE_METHOD]: {
        security: SECURITY,
        responses: BROKEN_RESPONSES,
    },
};

const PATHS = {
    [VALID_OAPI_PATH]: VALID_SCHEMA,
    [NO_SECURITY_PATH]: NO_SECURITY_SCHEMA,
    [NO_RESPONSES_PATH]: NO_RESPONSES_SCHEMA,
    [BROKEN_REQUEST_PATH]: BROKEN_REQUEST_SCHEMA,
    [BROKEN_RESPONSE_PATH]: BROKEN_RESPONSE_SCHEMA,
};

const firetailContext = {
    securityHandlers: {
        [SECURITY_HANDLER_ID]: SECURITY_HANDLER_FN,
    },
};

const SECURITY_SPEC = {
    type: "apiKey",
    in: "header",
    name: "X-FireTail-API-KEY",
};

const apiSpec = {
    paths: PATHS,
    components: {
        securitySchemes: {
            [SECURITY_HANDLER_ID]: SECURITY_SPEC,
        },
    },
};

_ajv.compile = jest.fn(schema => {
    if (schema[THROW]) {
        throw new Error();
    }
    return () => ({});
});

describe("The FireTail apiRoute matcher should", () => {
    const routes = apiRoutes(apiSpec, firetailContext);

    test("return an object with a `match` function", () => {
        expect(typeof routes.matchReq === "function").toBe(true);
    });
    test("   that matches a valid route, with correct paths, schema and handlers", () => {
        const match = routes.matchReq({ route: { path: VALID_EXP_PATH } });
        expect(match.path).toBe(VALID_EXP_PATH);
        expect(match.openAPIPath).toBe(VALID_OAPI_PATH);
        expect(match.schema).toMatchObject(VALID_SCHEMA);
        expect(
            match.securityHandlers[VALID_METHOD] instanceof
                OpenAPISecurityHandler
        ).toBe(true);
        expect(
            match.requestValidators[VALID_METHOD] instanceof
                OpenAPIRequestValidator
        ).toBe(true);
        expect(
            match.responseValidators[VALID_METHOD] instanceof
                OpenAPIResponseValidator
        ).toBe(true);
        expect(
            typeof match.responseSanitisers[VALID_METHOD][STATUS] === "function"
        ).toBe(true);
    });
    test("find missing security handlers", () => {
        expect(missingSecurityHandlers).toHaveLength(1);
        expect(missingSecurityHandlers[0].method).toBe(NO_SECURITY_METHOD);
        expect(missingSecurityHandlers[0].path).toBe(NO_SECURITY_PATH);
    });
    test("find missing request validators", () => {
        expect(missingRequestValidators).toHaveLength(1);
        expect(missingRequestValidators[0].method).toBe(BROKEN_REQUEST_METHOD);
        expect(missingRequestValidators[0].path).toBe(BROKEN_REQUEST_PATH);
    });
    test("find missing response validators", () => {
        expect(missingResponseValidators).toHaveLength(1);
        expect(missingResponseValidators[0].method).toBe(NO_RESPONSES_METHOD);
        expect(missingResponseValidators[0].path).toBe(NO_RESPONSES_PATH);
    });
    test("find missing response validators", () => {
        expect(missingResponseSanitisers).toHaveLength(1);
        expect(missingResponseSanitisers[0].method).toBe(
            BROKEN_RESPONSE_METHOD
        );
        expect(missingResponseSanitisers[0].path).toBe(BROKEN_RESPONSE_PATH);
        /* NOTE: for some reason status code gets stringified somewhere */
        expect(+missingResponseSanitisers[0].code).toBe(BROKEN_STATUS);
    });
});
