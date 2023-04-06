/* eslint-disable-next-line */
// @ts-nocheck
import cloneDeep from "lodash/cloneDeep";

import onResponse from "../../src/responseHandlers/onResponse";

const STATUS = 200;
const METHOD = "get";
const SCHEMA = {
    [METHOD]: {
        "x-ft-security": { foo: "bar" },
    },
};
const MATCH = {
    schema: SCHEMA,
    responseValidators: {
        [METHOD]: {
            validateResponse: () => null,
        },
    },
    responseSanitisers: {
        [METHOD]: {
            [STATUS]: () => true,
        },
    },
};
const PATH = "/foo";
const CONTEXT = {
    path: PATH,
    match: MATCH,
    method: METHOD,
};
const PRINCIPAL = "fred";

const VALID_RES = {
    statusCode: STATUS,
    firetailContext: {
        ...CONTEXT,
        observations: [],
        accessResolvers: {},
        identityResolvers: {},
        responseValidated: true,
        responseSanitised: true,
        responseAuthorized: true,
        authenticatedPrincipal: PRINCIPAL,
    },
    get: () => "application/json",
    req: {
        get: () => "application/json",
    },
};

describe("The onResponse handler should, even for an intercepted request,", () => {
    const RES = {
        statusCode: STATUS,
        firetailContext: {
            ...CONTEXT,
            intercepted: true,
            originalResponseBody: null,
        },
    };
    test("correctly set the context's responseBody from a string", async () => {
        const STRING = "string";
        await onResponse("send", RES, [STRING]);
        expect(RES.firetailContext.responseBody).toBe(STRING);
        expect(RES.firetailContext.originalResponseBody).toBe(STRING);
    });
    test("correctly set the context's responseBody from an object", async () => {
        const OBJECT = { foo: "bar" };
        const STRINGIFIED = JSON.stringify(OBJECT);
        RES.firetailContext.originalResponseBody = null;
        await onResponse("send", RES, [OBJECT]);
        expect(RES.firetailContext.responseBody).toBe(STRINGIFIED);
        expect(RES.firetailContext.originalResponseBody).toBe(STRINGIFIED);
    });
    test("not overwrite an existing originalResponseBody", async () => {
        const EXISTING_STRING = "existingString";
        const NEW_STRING = "newString";
        RES.firetailContext.originalResponseBody = EXISTING_STRING;
        await onResponse("send", RES, [NEW_STRING]);
        expect(RES.firetailContext.originalResponseBody).toBe(EXISTING_STRING);
    });
});

describe("For headers, the onResponse handler should", () => {
    test("observe a missing accept header", async () => {
        const ACCEPT_MISSING = cloneDeep(VALID_RES);
        ACCEPT_MISSING.get = () => null;
        ACCEPT_MISSING.req.get = () => null;
        const valid = await onResponse("send", ACCEPT_MISSING, [{}]);
        const o = ACCEPT_MISSING.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe("firetail.request.accept.header.missing");
        expect(valid).toMatchObject({});
    });
    test("return an error when accept and content-type are mismatched", async () => {
        const TYPE_MIS_MATCH = {
            statusCode: STATUS,
            firetailContext: {
                ...CONTEXT,
                observations: [],
            },
            get: () => "text/text",
            req: {
                get: () => "application/json",
            },
        };
        const error = await onResponse("send", TYPE_MIS_MATCH, [{}]);
        const o = TYPE_MIS_MATCH.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].status).toBe(406);
        expect(o[0].type).toBe("firetail.incorrect.response.content.type");
        expect(o[0]).toMatchObject(error.error);
    });
});

describe("When sanitising, the onResponse handler should", () => {
    test("set the sanitised flag", async () => {
        const SANITISER = cloneDeep(VALID_RES);
        SANITISER.firetailContext.responseSanitised = false;
        const valid = await onResponse("send", SANITISER, [{}]);
        expect(valid).toMatchObject({});
        expect(SANITISER.firetailContext.responseSanitised).toBe(true);
    });
    test("return an error, when sanitisation fails", async () => {
        const ERRORS = "errors";
        const SANITISER = cloneDeep(VALID_RES);
        SANITISER.firetailContext.responseSanitised = false;
        const FN = jest.fn(() => false);
        FN.errors = ERRORS;
        SANITISER.firetailContext.match.responseSanitisers[METHOD][STATUS] = FN;
        const error = await onResponse("send", SANITISER, [{}]);
        expect(FN).toHaveBeenCalledTimes(1);
        const o = SANITISER.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].status).toBe(500);
        expect(o[0].details).toBe(ERRORS);
        expect(o[0].type).toBe("firetail.response.sanitisation.failed");
        expect(o[0]).toMatchObject(error.error);
    });
});

describe("When validating, the onResponse handler should", () => {
    test("set the validated flag", async () => {
        const VALIDATER = cloneDeep(VALID_RES);
        VALIDATER.firetailContext.responseValidated = false;
        const valid = await onResponse("send", VALIDATER, [{}]);
        expect(valid).toMatchObject({});
        expect(VALIDATER.firetailContext.responseValidated).toBe(true);
    });
    test("return an error and set the validated flag, when validation fails", async () => {
        const ERRORS = "errors";
        const VALIDATER = cloneDeep(VALID_RES);
        VALIDATER.firetailContext.responseValidated = false;
        VALIDATER.firetailContext.match.responseValidators[METHOD] = {
            validateResponse: () => ERRORS,
        };
        const error = await onResponse("send", VALIDATER, [{}]);
        const o = VALIDATER.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].status).toBe(500);
        expect(o[0].details).toBe(ERRORS);
        expect(o[0].type).toBe("firetail.response.validation.failed");
        expect(o[0]).toMatchObject(error.error);
    });
});
