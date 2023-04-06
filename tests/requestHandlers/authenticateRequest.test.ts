/* eslint-disable-next-line */
// @ts-nocheck
import authenticateRequest from "../../src/requestHandlers/authenticateRequest";

const AUTH_METHOD = "put";
const ERROR_METHOD = "post";
const NON_EXISTENT_METHOD = "patch";
const STATUS = 666;
const VALIDATE_FN = jest.fn(async () => true);
const VALIDATE_ERROR_FN = jest.fn(async () => {
    /* eslint-disable-next-line */
    throw { status: STATUS };
});

const PRINCIPAL = "principal";
const PRINCIPAL_PATH = "principalPath";

const NOT_A_RESOLVER_ID = "notAResolver";
const BROKEN_RESOLVER_ID = "incorrectResolverId";
const WORKING_RESOLVER_ID = "correctResolverId";

const WORKING_RESOLVER_FN = jest.fn(() => PRINCIPAL);
const BROKEN_RESOLVER_FN = jest.fn(() => null);
const NOT_A_RESOLVER_FN = "thisIsNotAFunction";

const MATCH = {
    securityHandlers: {
        [AUTH_METHOD]: {
            handle: VALIDATE_FN,
        },
        [ERROR_METHOD]: {
            handle: VALIDATE_ERROR_FN,
        },
    },
};

const firetailContext = {
    authenticatedPrincipal: null,
    match: MATCH,
    identityResolvers: {
        [WORKING_RESOLVER_ID]: WORKING_RESOLVER_FN,
        [BROKEN_RESOLVER_ID]: BROKEN_RESOLVER_FN,
        [NOT_A_RESOLVER_ID]: NOT_A_RESOLVER_FN,
    },
};

const WORKING_RESOLVER_SCHEMA = {
    [AUTH_METHOD]: {
        "x-ft-security": {
            "authenticated-principal-resolver": WORKING_RESOLVER_ID,
        },
    },
};
const BROKEN_RESOLVER_SCHEMA = {
    [AUTH_METHOD]: {
        "x-ft-security": {
            "authenticated-principal-resolver": BROKEN_RESOLVER_ID,
        },
    },
};
const NOT_A_RESOLVER_SCHEMA = {
    [AUTH_METHOD]: {
        "x-ft-security": {
            "authenticated-principal-resolver": NOT_A_RESOLVER_ID,
        },
    },
};
const PATH_SCHEMA = {
    [AUTH_METHOD]: {
        "x-ft-security": {
            "authenticated-principal-path": PRINCIPAL_PATH,
        },
    },
};
const NO_PATH_SCHEMA = {
    [AUTH_METHOD]: {
        "x-ft-security": {},
    },
};

describe("The request authentication handler should", () => {
    test("call the authentication function and set the authentication flag", async () => {
        const request = {
            /* This would normally be added by the security handler */
            [PRINCIPAL_PATH]: PRINCIPAL,
            firetailContext: {
                ...firetailContext,
                match: {
                    ...MATCH,
                    schema: PATH_SCHEMA,
                },
                method: AUTH_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        const result = await authenticateRequest(request);
        expect(result).toMatchObject({});
        expect(VALIDATE_FN).toHaveBeenCalledWith(request);
        expect(request.firetailContext.authenticated).toBe(true);
        expect(request.firetailContext.authenticatedPrincipal).toBe(PRINCIPAL);
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(0);
    });
    test("work correctly when a resolver function is specified", async () => {
        const request = {
            /* This would normally be added by the security handler */
            [PRINCIPAL_PATH]: PRINCIPAL,
            firetailContext: {
                ...firetailContext,
                match: {
                    ...MATCH,
                    schema: WORKING_RESOLVER_SCHEMA,
                },
                method: AUTH_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        const result = await authenticateRequest(request);
        expect(result).toMatchObject({});
        expect(VALIDATE_FN).toHaveBeenCalledWith(request);
        expect(request.firetailContext.authenticated).toBe(true);
        expect(request.firetailContext.authenticatedPrincipal).toBe(PRINCIPAL);
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(0);
    });
    test("return an error when authentication fails", async () => {
        const request = {
            firetailContext: {
                ...firetailContext,
                match: {
                    ...MATCH,
                    schema: PATH_SCHEMA,
                },
                method: ERROR_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        const result = await authenticateRequest(request);
        expect(result.status).toBe(STATUS);
        expect(result.error.type).toBe(
            "firetail.request.authentication.failed"
        );
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0]).toMatchObject(result.error);
    });
    test("observe a missing principal when no path is specified", async () => {
        const request = {
            /* This would normally be added by the security handler */
            [PRINCIPAL_PATH]: PRINCIPAL,
            firetailContext: {
                ...firetailContext,
                match: {
                    ...MATCH,
                    schema: NO_PATH_SCHEMA,
                },
                method: AUTH_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        await authenticateRequest(request);
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe("firetail.authenticated.principal.not.defined");
    });
    test("observe a missing principal when a broken resolver is specified", async () => {
        const request = {
            /* This would normally be added by the security handler */
            [PRINCIPAL_PATH]: PRINCIPAL,
            firetailContext: {
                ...firetailContext,
                match: {
                    ...MATCH,
                    schema: BROKEN_RESOLVER_SCHEMA,
                },
                method: AUTH_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        await authenticateRequest(request);
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe("firetail.authenticated.principal.not.defined");
    });
    test("observe a broken resolver when resolver is not a function", async () => {
        const request = {
            /* This would normally be added by the security handler */
            [PRINCIPAL_PATH]: PRINCIPAL,
            firetailContext: {
                ...firetailContext,
                match: {
                    ...MATCH,
                    schema: NOT_A_RESOLVER_SCHEMA,
                },
                method: AUTH_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        await authenticateRequest(request);
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(1);
        expect(o[0].type).toBe(
            "firetail.authentication.identity.resolver.missing"
        );
    });
    test("observe a missing security handler", async () => {
        const request = {
            firetailContext: {
                ...firetailContext,
                method: NON_EXISTENT_METHOD,
                observations: [],
                authenticated: null,
            },
        };
        await authenticateRequest(request);
        const o = request.firetailContext.observations;
        expect(o).toHaveLength(2);
        expect(o[0].type).toBe("firetail.security.handler.missing");
        expect(o[1].type).toBe("firetail.authenticated.principal.not.defined");
    });
});
